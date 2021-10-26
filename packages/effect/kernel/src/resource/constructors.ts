import { $, $type, id, Kind, pipe, tupled, TyK, TyVar } from '@fp4ts/core';
import {
  Functor,
  ApplicativeError,
  Either,
  Kleisli,
  FunctionK,
  KleisliK,
} from '@fp4ts/cats';

import { MonadCancel } from '../monad-cancel';
import { Sync } from '../sync';
import { Spawn } from '../spawn';
import { Clock } from '../clock';
import { Concurrent } from '../concurrent';
import { Temporal } from '../temporal';
import { Async } from '../async';
import { Poll } from '../poll';
import { Cont } from '../cont';
import { Ref } from '../ref';
import { Deferred } from '../deferred';
import { ExecutionContext } from '../execution-context';

import { Allocate, Eval, Pure, Resource } from './algebra';
import { ExitCase } from './exit-case';
import { allocated, flatMap_, flatten, map_ } from './operators';
import { ResourceK } from './resource';

export const pure = <F, A>(a: A): Resource<F, A> => new Pure(a);

export const unit = <F>(): Resource<F, void> => pure(undefined);

export const liftF = <F, A>(fa: Kind<F, [Resource<F, A>]>): Resource<F, A> =>
  flatMap_(evalF(fa), id);

export const evalF = <F, A>(fa: Kind<F, [A]>): Resource<F, A> => new Eval(fa);

export const liftK =
  <F>(): FunctionK<F, $<ResourceK, [F]>> =>
  <A>(fa: Kind<F, [A]>): Resource<F, A> =>
    evalF(fa);

export const allocate =
  <F>(F: Functor<F>) =>
  <A>(resource: Kind<F, [[A, Kind<F, [void]>]]>): Resource<F, A> =>
    allocateCase(F.map_(resource, ([a, release]) => [a, () => release]));

export const allocateCase = <F, A>(
  resource: Kind<F, [[A, (ec: ExitCase) => Kind<F, [void]>]]>,
): Resource<F, A> => allocateFull(() => resource);

export const allocateFull = <F, A>(
  resource: (p: Poll<F>) => Kind<F, [[A, (e: ExitCase) => Kind<F, [void]>]]>,
): Resource<F, A> => new Allocate(resource);

export const make =
  <F>(F: Functor<F>) =>
  <A>(
    acquire: Kind<F, [A]>,
    release: (a: A, e: ExitCase) => Kind<F, [void]>,
  ): Resource<F, A> =>
    allocateCase(F.map_(acquire, a => [a, e => release(a, e)]));

export const makeFull =
  <F>(F: Functor<F>) =>
  <A>(
    acquire: (p: Poll<F>) => Kind<F, [A]>,
    release: (a: A, e: ExitCase) => Kind<F, [void]>,
  ): Resource<F, A> =>
    allocateFull(p => F.map_(acquire(p), a => [a, e => release(a, e)]));

export const tailRecM =
  <S>(s: S) =>
  <F, A>(f: (s: S) => Resource<F, Either<S, A>>): Resource<F, A> =>
    tailRecM_(s, f);

export const tailRecM_ = <F, A, S>(
  s: S,
  f: (s: S) => Resource<F, Either<S, A>>,
): Resource<F, A> =>
  flatMap_(f(s), ea => ea.fold(ss => tailRecM_(ss, f), pure));

export const throwError =
  <F>(F: ApplicativeError<F, Error>) =>
  (e: Error): Resource<F, never> =>
    evalF(F.throwError(e));

export const canceled = <F>(F: MonadCancel<F, Error>): Resource<F, void> =>
  evalF(F.canceled);

export const uncancelable =
  <F>(F: MonadCancel<F, Error>) =>
  <A>(body: (p: Poll<$<ResourceK, [F]>>) => Resource<F, A>): Resource<F, A> =>
    allocateFull(poll => {
      const inner: Poll<$<ResourceK, [F]>> = <B>(
        rfb: Resource<F, B>,
      ): Resource<F, B> =>
        allocateFull<F, B>(innerPoll =>
          F.map_(innerPoll(poll(allocated(F)(rfb))), ([b, rel]) => [
            b,
            (_: ExitCase) => rel,
          ]),
        );

      return F.map_(allocated(F)(body(inner)), ([a, rel]) => [
        a,
        (_: ExitCase) => rel,
      ]);
    });

export const delay =
  <F>(F: Sync<F>) =>
  <A>(thunk: () => A): Resource<F, A> =>
    evalF(F.delay(thunk));

export const defer =
  <F>(F: Sync<F>) =>
  <A>(thunk: () => Resource<F, A>): Resource<F, A> =>
    flatten(delay(F)(thunk));

export const suspend = <F>(F: Spawn<F, Error>): Resource<F, void> =>
  evalF(F.suspend);

export const never = <F>(F: Spawn<F, Error>): Resource<F, never> =>
  evalF(F.never);

export const deferred =
  <F>(F: Concurrent<F, Error>) =>
  <A>(): Resource<F, Deferred<$<ResourceK, [F]>, A>> =>
    map_(evalF<F, Deferred<F, A>>(F.deferred<A>()), d => d.mapK(liftK<F>()));

export const ref =
  <F>(F: Concurrent<F, Error>) =>
  <A>(a: A): Resource<F, Ref<$<ResourceK, [F]>, A>> =>
    map_(evalF<F, Ref<F, A>>(F.ref<A>(a)), r => r.mapK(liftK<F>()));

export const monotonic = <F>(F: Clock<F>): Resource<F, number> =>
  evalF(F.monotonic);

export const realTime = <F>(F: Clock<F>): Resource<F, number> =>
  evalF(F.realTime);

export const sleep =
  <F>(F: Temporal<F, Error>) =>
  (ms: number): Resource<F, void> =>
    evalF(F.sleep(ms));

export const cont =
  <F>(F: Async<F>) =>
  <K, R>(body: Cont<$<ResourceK, [F]>, K, R>): Resource<F, R> =>
    allocateFull(poll =>
      poll(
        F.cont<K, (r: R, ec: ExitCase) => Kind<F, [void]>>(
          <G>(G: MonadCancel<G, Error>) =>
            (
              resume: (ea: Either<Error, K>) => void,
              get: Kind<G, [K]>,
              lift: FunctionK<F, G>,
            ) => {
              type D = $<KleisliK, [G, Ref<G, Kind<F, [void]>>]>;

              const lift2: FunctionK<$<ResourceK, [F]>, D> = rfa =>
                Kleisli(r =>
                  G.flatMap_(lift(allocated(F)(rfa)), ([a, fin]) =>
                    G.map_(
                      r.update(fv =>
                        F.finalize_(fv, oc =>
                          oc.fold(
                            () => F.unit,
                            () => fin,
                            () => fin,
                          ),
                        ),
                      ),
                      () => a,
                    ),
                  ),
                );

              return pipe(
                G.Do,
                G.bindTo('r', lift(F.map_(F.ref(F.unit), x => x.mapK(lift)))),

                G.bindTo('a', ({ r }) =>
                  G.finalize_(
                    body<D>(MonadCancel.monadCancelForKleisli(G))(
                      resume,
                      Kleisli.liftF<G, K>(get),
                      lift2,
                    ).run(r),
                    oc =>
                      oc.fold(
                        () => G.flatMap_(r.get(), lift),
                        () => G.flatMap_(r.get(), lift),
                        () => G.unit,
                      ),
                  ),
                ),

                G.bindTo('fin', ({ r }) => r.get()),

                G.map(({ a, fin }) => tupled(a, (_: ExitCase) => fin)),
              );
            },
        ),
      ),
    );

export const readExecutionContext = <F>(
  F: Async<F>,
): Resource<F, ExecutionContext> => evalF(F.readExecutionContext);
