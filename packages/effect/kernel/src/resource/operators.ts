import { $, compose, fst, id, Kind, pipe, snd, tupled } from '@fp4ts/core';
import {
  Kleisli,
  List,
  Either,
  Right,
  Left,
  Monoid,
  ApplicativeError,
} from '@fp4ts/cats';

import { Async } from '../async';
import { Concurrent } from '../concurrent';
import { MonadCancel } from '../monad-cancel';
import { Fiber } from '../fiber';
import { Outcome } from '../outcome';
import { ExecutionContext } from '../execution-context';

import { FlatMap, Resource, view } from './algebra';
import {
  allocate,
  allocateFull,
  evalF,
  make,
  pure,
  unit,
} from './constructors';
import { ExitCase } from './exit-case';
import { ResourceK } from './resource';
import { resourceConcurrent } from './instances';

export const use: <F>(
  F: MonadCancel<F, Error>,
) => <A, B>(f: (a: A) => Kind<F, [B]>) => (r: Resource<F, A>) => Kind<F, [B]> =
  F => f => r =>
    use_(F)(r, f);

export const useKleisli: <F>(
  F: MonadCancel<F, Error>,
) => <A, B>(k: Kleisli<F, A, B>) => (r: Resource<F, A>) => Kind<F, [B]> =
  F => k => r =>
    useKleisli_(F)(r, k);

export const surround: <F>(
  F: MonadCancel<F, Error>,
) => <B>(fb: Kind<F, [B]>) => <A>(r: Resource<F, A>) => Kind<F, [B]> =
  F => fb => r =>
    surround_(F)(r, fb);

export const map: <A, B>(
  f: (a: A) => B,
) => <F>(r: Resource<F, A>) => Resource<F, B> = f => r => map_(r, f);

export const evalMap: <F, A, B>(
  f: (a: A) => Kind<F, [B]>,
) => (r: Resource<F, A>) => Resource<F, B> = f => r => evalMap_(r, f);

export const evalTap: <F, A>(
  f: (a: A) => Kind<F, [unknown]>,
) => (r: Resource<F, A>) => Resource<F, A> = f => r => evalTap_(r, f);

export const flatMap: <F, A, B>(
  f: (a: A) => Resource<F, B>,
) => (r: Resource<F, A>) => Resource<F, B> = f => r => flatMap_(r, f);

export const flatten = <F, A>(
  rr: Resource<F, Resource<F, A>>,
): Resource<F, A> => flatMap_(rr, id);

export const combine: <A>(
  A: Monoid<A>,
) => <F>(rhs: Resource<F, A>) => (lhs: Resource<F, A>) => Resource<F, A> =
  F => rhs => lhs =>
    combine_(F)(lhs, rhs);

export const handleError: <F>(
  F: ApplicativeError<F, Error>,
) => <AA>(
  h: (e: Error) => AA,
) => <A extends AA>(r: Resource<F, A>) => Resource<F, AA> = F => h => r =>
  handleError_(F)(r, h);

export const handleErrorWith: <F>(
  F: ApplicativeError<F, Error>,
) => <AA>(
  h: (e: Error) => Resource<F, AA>,
) => <A extends AA>(r: Resource<F, A>) => Resource<F, AA> = F => h => r =>
  handleErrorWith_(F)(r, h);

export const attempt =
  <F>(F: ApplicativeError<F, Error>) =>
  <A>(r: Resource<F, A>): Resource<F, Either<Error, A>> => {
    const v = view(r);

    switch (v.tag) {
      case 'allocate':
        return allocateFull(poll =>
          pipe(
            v.resource(poll),
            F.attempt,
            F.map(ea =>
              ea.fold(
                e => [Left(e) as Either<Error, A>, (_: ExitCase) => F.unit],
                ([a, release]) => [Right(a) as Either<Error, A>, release],
              ),
            ),
          ),
        );

      case 'flatMap':
        return pipe(
          unit<F>(),
          flatMap(() => attempt(F)(v.self)),
          flatMap(ea =>
            ea.fold(
              error => pure(Left(error) as Either<Error, A>),
              e => attempt(F)(v.f(e)),
            ),
          ),
        );

      case 'pure':
        return pure(Right(v.value));

      case 'eval':
        return evalF(F.attempt(v.fa));
    }
  };

export const onCancel: <F>(
  F: MonadCancel<F, Error>,
) => (fin: Resource<F, void>) => <A>(r: Resource<F, A>) => Resource<F, A> =
  F => fin => r =>
    onCancel_(F)(r, fin);

export const finalize: <F>(
  F: MonadCancel<F, Error>,
) => <A>(
  fin: (oc: Outcome<$<ResourceK, [F]>, Error, A>) => Resource<F, void>,
) => (r: Resource<F, A>) => Resource<F, A> = F => fin => r =>
  finalize_(F)(r, fin);

export const both: <F>(
  F: Concurrent<F, Error>,
) => <B>(
  rhs: Resource<F, B>,
) => <A>(lhs: Resource<F, A>) => Resource<F, [A, B]> = F => rhs => lhs =>
  both_(F)(lhs, rhs);

export const race: <F>(
  F: Concurrent<F, Error>,
) => <B>(
  rb: Resource<F, B>,
) => <A>(ra: Resource<F, A>) => Resource<F, Either<A, B>> = F => rb => ra =>
  race_(F)(ra, rb);

export const fork =
  <F>(F: Concurrent<F, Error>) =>
  <A>(r: Resource<F, A>): Resource<F, Fiber<$<ResourceK, [F]>, Error, A>> => {
    class State {
      constructor(
        readonly fin: Kind<F, [void]> = F.unit,
        readonly finalizeOnComplete: boolean = false,
        readonly confirmedFinalizeOnComplete: boolean = false,
      ) {}

      public copy({
        fin = this.fin,
        finalizeOnComplete = this.finalizeOnComplete,
        confirmedFinalizeOnComplete = this.confirmedFinalizeOnComplete,
      }: Omit<Partial<State>, 'copy'> = {}): State {
        return new State(fin, finalizeOnComplete, confirmedFinalizeOnComplete);
      }
    }

    return pipe(
      F.ref(new State()),
      F.flatMap(state => {
        const finalized: Kind<F, [A]> = F.uncancelable(poll =>
          pipe(
            poll(allocated(F)(r)),
            F.finalize(() =>
              state.update(s =>
                s.finalizeOnComplete
                  ? s.copy({ confirmedFinalizeOnComplete: true })
                  : s,
              ),
            ),
            F.flatMap(([a, rel]) =>
              pipe(
                state.modify(s =>
                  s.confirmedFinalizeOnComplete
                    ? [s, F.handleError_(rel, () => {})]
                    : [s.copy({ fin: rel }), F.unit],
                ),
                F.flatten,
                F.map(() => a),
              ),
            ),
          ),
        );

        return F.map_(F.fork(finalized), outer => {
          const fiber: Fiber<
            $<ResourceK, [F]>,
            Error,
            A
          > = new (class extends Fiber<$<ResourceK, [F]>, Error, A> {
            get cancel(): Resource<F, void> {
              return evalF(
                F.uncancelable(poll =>
                  pipe(
                    poll(outer.cancel),
                    F.productR(
                      state.update(s => s.copy({ finalizeOnComplete: true })),
                    ),
                  ),
                ),
              );
            }

            get join(): Resource<F, Outcome<$<ResourceK, [F]>, Error, A>> {
              return evalF(
                F.flatMap_(outer.join, oc =>
                  oc.fold(
                    () => F.pure(Outcome.canceled()),
                    error => F.pure(Outcome.failure(error)),
                    fp =>
                      pipe(
                        state.get(),
                        F.map(s =>
                          s.confirmedFinalizeOnComplete
                            ? Outcome.canceled()
                            : Outcome.success<$<ResourceK, [F]>, A>(evalF(fp)),
                        ),
                      ),
                  ),
                ),
              );
            }
          })();

          const finalizeOuter = state.modify(s => [
            s.copy({ finalizeOnComplete: true }),
            s.fin,
          ]);

          return [fiber, F.flatten(finalizeOuter)] as const;
        });
      }),
      allocate(F),
    );
  };

export const allocated =
  <F>(F: MonadCancel<F, Error>) =>
  <A>(r: Resource<F, A>): Kind<F, [[A, Kind<F, [void]>]]> => {
    type Frame = (u: unknown) => Resource<F, unknown>;
    type Stack = List<Frame>;

    const loop = (
      cur0: Resource<F, unknown>,
      stack: Stack,
      release: Kind<F, [void]>,
    ): Kind<F, [[A, Kind<F, [void]>]]> => {
      let _cur = cur0;
      while (true) {
        const cur = view(_cur);

        switch (cur.tag) {
          case 'flatMap':
            _cur = cur.self;
            stack = stack.prepend(cur.f);
            continue;

          case 'pure': {
            const next = stack.uncons;
            if (next.isEmpty) return F.pure([cur.value, release]);
            const [hd, tl] = next.get;
            _cur = hd(cur.value);
            stack = tl;
            continue;
          }

          case 'allocate':
            return F.uncancelable(poll =>
              pipe(
                cur.resource(poll),
                F.flatMap(([b, rel]) => {
                  const rel2 = F.finalize_(
                    rel(ExitCase.Succeeded),
                    () => release,
                  );

                  return stack.fold(
                    () => F.pure([b, rel2]),
                    (hd, tl) =>
                      pipe(
                        poll(loop(hd(b), tl, rel2)),
                        F.onCancel(rel(ExitCase.Canceled)),
                        F.onError(e =>
                          F.handleError_(rel(ExitCase.Errored(e)), () => {}),
                        ),
                      ),
                  );
                }),
              ),
            );

          case 'eval':
            return F.flatMap_(cur.fa, a => loop(pure(a), stack, release));
        }
      }
    };

    return loop(r, List.empty, F.unit);
  };

export const fold: <F>(
  F: MonadCancel<F, Error>,
) => <A, B>(
  onOutput: (a: A) => Kind<F, [B]>,
) => (
  onRelease: (fv: Kind<F, [void]>) => Kind<F, [void]>,
) => (r: Resource<F, A>) => Kind<F, [B]> = F => onOutput => onRelease => r =>
  fold_(F)(r, onOutput, onRelease);

// -- Point-ful operators

export const use_ =
  <F>(F: MonadCancel<F, Error>) =>
  <A, B>(r: Resource<F, A>, f: (a: A) => Kind<F, [B]>): Kind<F, [B]> =>
    fold_(F)(r, f, id);

export const useKleisli_ =
  <F>(F: MonadCancel<F, Error>) =>
  <A, B>(r: Resource<F, A>, k: Kleisli<F, A, B>): Kind<F, [B]> =>
    use_(F)(r, k.run);

export const surround_ =
  <F>(F: MonadCancel<F, Error>) =>
  <A, B>(r: Resource<F, A>, fb: Kind<F, [B]>): Kind<F, [B]> =>
    use_(F)(r, () => fb);

export const map_ = <F, A, B>(
  r: Resource<F, A>,
  f: (a: A) => B,
): Resource<F, B> => flatMap_(r, x => pure(f(x)));

export const evalMap_ = <F, A, B>(
  r: Resource<F, A>,
  f: (a: A) => Kind<F, [B]>,
): Resource<F, B> => flatMap_(r, x => evalF(f(x)));

export const evalTap_ = <F, A, B>(
  r: Resource<F, A>,
  f: (a: A) => Kind<F, [unknown]>,
): Resource<F, A> =>
  flatMap_(r, x =>
    pipe(
      evalF(f(x)),
      map(() => x),
    ),
  );

export const flatMap_ = <F, A, B>(
  r: Resource<F, A>,
  f: (a: A) => Resource<F, B>,
): Resource<F, B> => new FlatMap(r, f);

export const combine_ =
  <A>(A: Monoid<A>) =>
  <F>(lhs: Resource<F, A>, rhs: Resource<F, A>): Resource<F, A> =>
    flatMap_(lhs, x => map_(rhs, y => A.combine_(x, () => y)));

export const handleError_ =
  <F>(F: ApplicativeError<F, Error>) =>
  <A>(r: Resource<F, A>, h: (e: Error) => A): Resource<F, A> =>
    handleErrorWith_(F)(r, compose(pure, h));

export const handleErrorWith_ =
  <F>(F: ApplicativeError<F, Error>) =>
  <A>(r: Resource<F, A>, h: (e: Error) => Resource<F, A>): Resource<F, A> =>
    pipe(
      attempt(F)(r),
      flatMap(ea => ea.fold(h, x => pure<F, A>(x))),
    );

export const onCancel_ =
  <F>(F: MonadCancel<F, Error>) =>
  <A>(r: Resource<F, A>, fin: Resource<F, void>): Resource<F, A> =>
    allocateFull(poll =>
      pipe(
        poll(allocated(F)(r)),
        F.onCancel(use_(F)(fin, () => F.unit)),
        F.map(([x, rel]) => [x, (_: ExitCase) => rel]),
      ),
    );

export const finalize_ =
  <F>(F: MonadCancel<F, Error>) =>
  <A>(
    r: Resource<F, A>,
    fin: (oc: Outcome<$<ResourceK, [F]>, Error, A>) => Resource<F, void>,
  ): Resource<F, A> =>
    allocateFull(poll => {
      const back = F.finalize_(poll(allocated(F)(r)), oc =>
        oc.fold(
          () =>
            pipe(
              fin(Outcome.canceled()),
              use(F)(() => F.unit),
            ),
          e =>
            pipe(
              fin(Outcome.failure(e)),
              use(F)(() => F.unit),
              F.handleError(() => {}),
            ),
          ft =>
            pipe(
              Outcome.success<$<ResourceK, [F]>, A>(evalF(F.map_(ft, fst))),
              fin,
              use(F)(() => F.unit),
              F.onError(() =>
                pipe(
                  F.flatMap_(ft, snd),
                  F.handleError(() => {}),
                ),
              ),
            ),
        ),
      );

      return F.map_(back, ([a, rel]) => [a, (_: ExitCase) => rel]);
    });

export const both_ =
  <F>(F: Concurrent<F, Error>) =>
  <A, B>(lhs: Resource<F, A>, rhs: Resource<F, B>): Resource<F, [A, B]> => {
    type Update = (
      u: (fv: Kind<F, [void]>) => Kind<F, [void]>,
    ) => Kind<F, [void]>;

    const allocate = <C>(
      r: Resource<F, C>,
      storeFinalizer: Update,
    ): Kind<F, [C]> =>
      fold_(F)(r, F.pure, release =>
        storeFinalizer(x => F.finalize_(x, () => release)),
      );

    const bothFinalizers = F.ref([F.unit, F.unit] as [
      Kind<F, [void]>,
      Kind<F, [void]>,
    ]);

    return pipe(
      make(F)(bothFinalizers, ref =>
        pipe(
          ref.get(),
          F.flatMap(([lhs, rhs]) => F.both_(lhs, rhs)),
          F.void,
        ),
      ),
      evalMap(store => {
        const lhsStore: Update = f => store.update(([l, r]) => [f(l), r]);
        const rhsStore: Update = f => store.update(([l, r]) => [l, f(r)]);

        return F.both_(allocate(lhs, lhsStore), allocate(rhs, rhsStore));
      }),
    );
  };

export const race_ =
  <F>(F: Concurrent<F, Error>) =>
  <A, B>(ra: Resource<F, A>, rb: Resource<F, B>): Resource<F, Either<A, B>> =>
    resourceConcurrent(F).race_(ra, rb);

export const fold_ =
  <F>(F: MonadCancel<F, Error>) =>
  <A, B>(
    r: Resource<F, A>,
    onOutput: (a: A) => Kind<F, [B]>,
    onRelease: (fv: Kind<F, [void]>) => Kind<F, [void]>,
  ): Kind<F, [B]> => {
    type Frame = (u: unknown) => Resource<F, unknown>;
    type Stack = List<Frame>;

    const loop = (cur0: Resource<F, unknown>, stack: Stack): Kind<F, [B]> => {
      let _cur = cur0;
      while (true) {
        const cur = view(_cur);

        switch (cur.tag) {
          case 'flatMap':
            _cur = cur.self;
            stack = stack.prepend(cur.f);
            continue;

          case 'pure': {
            const next = stack.uncons;
            if (next.isEmpty) return onOutput(cur.value as A);
            const [hd, tl] = next.get;
            _cur = hd(cur.value);
            stack = tl;
            continue;
          }

          case 'allocate':
            return F.bracketFull(
              cur.resource,
              ([a]) => loop(pure(a), stack),
              ([, release], oc) => onRelease(release(ExitCase.fromOutcome(oc))),
            );

          case 'eval':
            return F.flatMap_(cur.fa, a => loop(pure(a), stack));
        }
      }
    };

    return loop(r, List.empty);
  };

export const executeOn_ =
  <F>(F: Async<F>) =>
  <A>(r: Resource<F, A>, ec: ExecutionContext): Resource<F, A> =>
    allocateFull(poll =>
      F.map_(poll(F.executeOn_(allocated(F)(r), ec)), ([a, fin]) =>
        tupled(a, (_: ExitCase) => fin),
      ),
    );
