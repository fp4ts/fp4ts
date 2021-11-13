import { Kind, pipe, tupled, $ } from '@fp4ts/core';
import {
  Applicative,
  Parallel,
  FunctionK,
  Either,
  Left,
  Right,
  KleisliK,
  Kleisli,
  Option,
  OptionTK,
  OptionT,
} from '@fp4ts/cats';

import { Poll } from './poll';
import { Fiber } from './fiber';
import { Outcome } from './outcome';
import { Unique, UniqueRequirements } from './unique';
import { MonadCancel, MonadCancelRequirements } from './monad-cancel';

export interface Spawn<F, E> extends MonadCancel<F, E>, Unique<F> {
  readonly fork: <A>(fa: Kind<F, [A]>) => Kind<F, [Fiber<F, E, A>]>;
  readonly never: Kind<F, [never]>;
  readonly suspend: Kind<F, [void]>;

  readonly racePair: <B>(
    fb: Kind<F, [B]>,
  ) => <A>(
    fa: Kind<F, [A]>,
  ) => Kind<
    F,
    [
      Either<
        [Outcome<F, E, A>, Fiber<F, E, B>],
        [Fiber<F, E, A>, Outcome<F, E, B>]
      >,
    ]
  >;
  readonly racePair_: <A, B>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
  ) => Kind<
    F,
    [
      Either<
        [Outcome<F, E, A>, Fiber<F, E, B>],
        [Fiber<F, E, A>, Outcome<F, E, B>]
      >,
    ]
  >;

  readonly race: <B>(
    fb: Kind<F, [B]>,
  ) => <A>(fa: Kind<F, [A]>) => Kind<F, [Either<A, B>]>;
  readonly race_: <A, B>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
  ) => Kind<F, [Either<A, B>]>;

  readonly raceOutcome: <B>(
    fb: Kind<F, [B]>,
  ) => <A>(
    fa: Kind<F, [A]>,
  ) => Kind<F, [Either<Outcome<F, E, A>, Outcome<F, E, B>>]>;
  readonly raceOutcome_: <A, B>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
  ) => Kind<F, [Either<Outcome<F, E, A>, Outcome<F, E, B>>]>;

  readonly both: <B>(
    fb: Kind<F, [B]>,
  ) => <A>(fa: Kind<F, [A]>) => Kind<F, [[A, B]]>;
  readonly both_: <A, B>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
  ) => Kind<F, [[A, B]]>;

  readonly bothOutcome: <B>(
    fb: Kind<F, [B]>,
  ) => <A>(fa: Kind<F, [A]>) => Kind<F, [[Outcome<F, E, A>, Outcome<F, E, B>]]>;
  readonly bothOutcome_: <A, B>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
  ) => Kind<F, [[Outcome<F, E, A>, Outcome<F, E, B>]]>;
}

export type SpawnRequirements<F, E> = Pick<
  Spawn<F, E>,
  'fork' | 'never' | 'suspend' | 'racePair_'
> &
  MonadCancelRequirements<F, E> &
  UniqueRequirements<F> &
  Partial<Spawn<F, E>>;
export const Spawn = Object.freeze({
  of: <F, E>(F: SpawnRequirements<F, E>): Spawn<F, E> => {
    const self: Spawn<F, E> = {
      racePair: fb => fa => self.racePair_(fa, fb),

      race: fb => fa => self.race_(fa, fb),
      race_: <A, B>(fa: Kind<F, [A]>, fb: Kind<F, [B]>) => {
        const cont = <X, Y>(
          poll: Poll<F>,
          oc: Outcome<F, E, X>,
          f: Fiber<F, E, Y>,
        ): Kind<F, [Either<X, Y>]> =>
          oc.fold(
            (): Kind<F, [Either<X, Y>]> =>
              pipe(
                poll(f.join),
                self.onCancel(f.cancel),
                self.flatMap(oc =>
                  oc.fold(
                    () => self.flatMap_(poll(self.canceled), () => self.never),
                    ey => self.throwError(ey),
                    fy => self.map_(fy, Right),
                  ),
                ),
              ),
            ex => F.flatMap_(f.cancel, () => F.throwError(ex)),
            fx =>
              pipe(
                f.cancel,
                self.flatMap(() => f.join),
                self.flatMap(oc =>
                  oc.fold(
                    () => self.map_(fx, Left),
                    ey => F.throwError(ey),
                    () => self.map_(fx, Left),
                  ),
                ),
              ),
          );

        return self.uncancelable(poll =>
          pipe(
            poll(self.racePair_(fa, fb)),
            self.flatMap(ea =>
              ea.fold(
                ([oc, f]) => cont(poll, oc, f),
                ([f, oc]) =>
                  pipe(
                    cont(poll, oc, f),
                    self.map(ea => ea.swapped),
                  ),
              ),
            ),
          ),
        );
      },

      raceOutcome: fb => fa => self.raceOutcome_(fa, fb),
      raceOutcome_: <A, B>(fa: Kind<F, [A]>, fb: Kind<F, [B]>) =>
        self.uncancelable(() =>
          pipe(
            self.racePair_(fa, fb),
            self.flatMap(ea =>
              ea.fold(
                ([oc, f]) =>
                  pipe(
                    f.cancel,
                    self.map(() => Left(oc)),
                  ),
                ([f, oc]) =>
                  pipe(
                    f.cancel,
                    self.map(() => Right(oc)),
                  ),
              ),
            ),
          ),
        ),

      both: fb => fa => self.both_(fa, fb),
      both_: <A, B>(fa: Kind<F, [A]>, fb: Kind<F, [B]>) => {
        const cont = <X, Y>(
          poll: Poll<F>,
          oc: Outcome<F, E, X>,
          f: Fiber<F, E, Y>,
        ): Kind<F, [[X, Y]]> =>
          oc.fold(
            () =>
              pipe(
                f.cancel,
                self.flatMap(() => poll(self.canceled)),
                self.flatMap(() => self.never),
              ),
            ex => self.flatMap_(f.cancel, () => self.throwError(ex)),
            fx =>
              pipe(
                poll(f.join),
                self.onCancel(f.cancel),
                self.flatMap(oc =>
                  oc.fold(
                    () => self.flatMap_(poll(self.canceled), () => self.never),
                    ey => self.throwError(ey),
                    fy => self.product_(fx, fy),
                  ),
                ),
              ),
          );

        return self.uncancelable(poll =>
          pipe(
            poll(self.racePair_(fa, fb)),
            self.flatMap(ea =>
              ea.fold(
                ([oc, f]) => cont(poll, oc, f),
                ([f, oc]) =>
                  pipe(
                    cont(poll, oc, f),
                    self.map(([b, a]) => [a, b]),
                  ),
              ),
            ),
          ),
        );
      },

      bothOutcome: fb => fa => self.bothOutcome_(fa, fb),
      bothOutcome_: (fa, fb) =>
        self.uncancelable(poll =>
          pipe(
            poll(self.racePair_(fa, fb)),
            self.flatMap(ea =>
              ea.fold(
                ([oc, f]) =>
                  pipe(
                    poll(f.join),
                    self.onCancel(f.cancel),
                    self.map(oc2 => [oc, oc2]),
                  ),
                ([f, oc]) =>
                  pipe(
                    poll(f.join),
                    self.onCancel(f.cancel),
                    self.map(oc2 => [oc2, oc]),
                  ),
              ),
            ),
          ),
        ),

      ...MonadCancel.of(F),
      ...F,
    };
    return self;
  },

  parallelForSpawn: <M, E>(M: Spawn<M, E>): Parallel<M, M> =>
    Parallel.of({
      applicative: Spawn.parallelApplicative(M),
      monad: M,
      sequential: FunctionK.id(),
      parallel: FunctionK.id(),
    }),

  parallelApplicative: <F, E>(F: Spawn<F, E>): Applicative<F> => {
    const self: Applicative<F> = Applicative.of({
      pure: F.pure,

      ap_: (ff, fa) => F.map2_(ff, fa)((f, a) => f(a)),

      product_: (fa, fb) => F.map2_(fa, fb)(tupled),

      map2_:
        <A, B>(fa: Kind<F, [A]>, fb: Kind<F, [B]>) =>
        <C>(f: (a: A, b: B) => C) =>
          F.uncancelable(poll =>
            pipe(
              F.Do,
              F.bindTo('fiberA', F.fork(fa)),
              F.bindTo('fiberB', F.fork(fb)),

              F.bind(({ fiberA, fiberB }) =>
                pipe(
                  fiberB.join,
                  F.flatMap(oc =>
                    oc.fold(
                      () => fiberA.cancel,
                      () => fiberA.cancel,
                      () => F.unit,
                    ),
                  ),
                  F.fork,
                ),
              ),
              F.bind(({ fiberA, fiberB }) =>
                pipe(
                  fiberA.join,
                  F.flatMap(oc =>
                    oc.fold(
                      () => fiberB.cancel,
                      () => fiberB.cancel,
                      () => F.unit,
                    ),
                  ),
                  F.fork,
                ),
              ),

              F.bindTo('a', ({ fiberA, fiberB }) =>
                pipe(
                  poll(fiberA.join),
                  F.onCancel(fiberB.cancel),
                  F.onCancel(fiberA.cancel),
                  F.flatMap(oc =>
                    oc.fold<Kind<F, [A]>>(
                      () =>
                        F.flatMap_(fiberB.cancel, () =>
                          pipe(
                            fiberB.join,
                            F.flatMap(oc =>
                              oc.fold(
                                () => F.flatMap_(F.canceled, () => F.never),
                                e => F.throwError(e),
                                () => F.flatMap_(F.canceled, () => F.never),
                              ),
                            ),
                            poll,
                          ),
                        ),
                      e => F.flatMap_(fiberB.cancel, () => F.throwError(e)),
                      a => a,
                    ),
                  ),
                ),
              ),

              F.bindTo('b', ({ fiberA, fiberB }) =>
                pipe(
                  poll(fiberB.join),
                  F.onCancel(fiberB.cancel),
                  F.flatMap(oc =>
                    oc.fold<Kind<F, [B]>>(
                      () =>
                        pipe(
                          fiberA.join,
                          F.flatMap(oc =>
                            oc.fold(
                              () => F.flatMap_(F.canceled, () => F.never),
                              e => F.throwError(e),
                              () => F.flatMap_(F.canceled, () => F.never),
                            ),
                          ),
                          poll,
                        ),
                      e => F.throwError(e),
                      b => b,
                    ),
                  ),
                ),
              ),

              F.map(({ a, b }) => f(a, b)),
            ),
          ),
    });
    return self;
  },

  spawnForKleisli: <F, E, R>(F: Spawn<F, E>): Spawn<$<KleisliK, [F, R]>, E> => {
    const liftOutcome = <A>(
      oc: Outcome<F, E, A>,
    ): Outcome<$<KleisliK, [F, R]>, E, A> => oc.mapK(Kleisli.liftF);

    const liftFiber = <A>(
      fiber: Fiber<F, E, A>,
    ): Fiber<$<KleisliK, [F, R]>, E, A> =>
      new (class extends Fiber<$<KleisliK, [F, R]>, E, A> {
        readonly join: Kleisli<F, R, Outcome<$<KleisliK, [F, R]>, E, A>> =
          Kleisli.liftF(F.map_(fiber.join, liftOutcome));

        readonly cancel: Kleisli<F, R, void> = Kleisli.liftF(fiber.cancel);
      })();

    return Spawn.of<$<KleisliK, [F, R]>, E>({
      ...MonadCancel.monadCancelForKleisli(F),

      unique: Kleisli.liftF(F.unique),

      fork: fa => Kleisli(r => F.map_(F.fork(fa.run(r)), liftFiber)),

      suspend: Kleisli.liftF(F.suspend),

      never: Kleisli.liftF(F.never),

      racePair_: <A, B>(
        fa: Kleisli<F, R, A>,
        fb: Kleisli<F, R, B>,
      ): Kleisli<
        F,
        R,
        Either<
          [
            Outcome<$<KleisliK, [F, R]>, E, A>,
            Fiber<$<KleisliK, [F, R]>, E, B>,
          ],
          [Fiber<$<KleisliK, [F, R]>, E, A>, Outcome<$<KleisliK, [F, R]>, E, B>]
        >
      > =>
        Kleisli((r: R) =>
          F.uncancelable(poll =>
            poll(
              pipe(
                F.racePair_(fa.run(r), fb.run(r)),
                F.map(rea =>
                  rea.fold(
                    ([oc, f]) => Left(tupled(liftOutcome(oc), liftFiber(f))),
                    ([f, oc]) => Right(tupled(liftFiber(f), liftOutcome(oc))),
                  ),
                ),
              ),
            ),
          ),
        ),
    });
  },

  spawnForOptionT: <F, E>(F: Spawn<F, E>): Spawn<$<OptionTK, [F]>, E> => {
    const liftOutcome = <A>(
      oc: Outcome<F, E, Option<A>>,
    ): Outcome<$<OptionTK, [F]>, E, A> =>
      oc.fold(
        () => Outcome.canceled(),
        e => Outcome.failure(e),
        fa => Outcome.success(OptionT(fa)),
      );

    const liftFiber = <A>(
      fiber: Fiber<F, E, Option<A>>,
    ): Fiber<$<OptionTK, [F]>, E, A> =>
      new (class extends Fiber<$<OptionTK, [F]>, E, A> {
        readonly join: OptionT<F, Outcome<$<OptionTK, [F]>, E, A>> =
          OptionT.liftF(F)(F.map_(fiber.join, liftOutcome));

        readonly cancel: OptionT<F, void> = OptionT.liftF(F)(fiber.cancel);
      })();

    return Spawn.of<$<OptionTK, [F]>, E>({
      ...MonadCancel.monadCancelForOptionT(F),

      unique: OptionT.liftF(F)(F.unique),

      fork: fa => OptionT.liftF(F)(F.map_(F.fork(fa.value), liftFiber)),

      suspend: OptionT.liftF(F)(F.suspend),

      never: OptionT.liftF(F)(F.never),

      racePair_: <A, B>(
        fa: OptionT<F, A>,
        fb: OptionT<F, B>,
      ): OptionT<
        F,
        Either<
          [Outcome<$<OptionTK, [F]>, E, A>, Fiber<$<OptionTK, [F]>, E, B>],
          [Fiber<$<OptionTK, [F]>, E, A>, Outcome<$<OptionTK, [F]>, E, B>]
        >
      > =>
        OptionT.liftF(F)(
          F.uncancelable(poll =>
            poll(
              pipe(
                F.racePair_(fa.value, fb.value),
                F.map(rea =>
                  rea.fold(
                    ([oc, f]) => Left(tupled(liftOutcome(oc), liftFiber(f))),
                    ([f, oc]) => Right(tupled(liftFiber(f), liftOutcome(oc))),
                  ),
                ),
              ),
            ),
          ),
        ),
    });
  },
});
