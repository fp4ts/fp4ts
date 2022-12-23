// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, Fix, Kind, tupled, TyK, TyVar, α, β, λ } from '@fp4ts/core';
import {
  Alternative,
  Applicative,
  Apply,
  FlatMap,
  FunctionK,
  Functor,
  isStackSafeMonad,
  Monad,
  MonadError,
  MonoidK,
  Profunctor,
  SemigroupK,
  Strong,
} from '@fp4ts/cats-core';
import { Left, Right } from '@fp4ts/cats-core/lib/data';
import { Monoid } from '@fp4ts/cats-kernel';
import { MonadState } from '../monad-state';
import { MonadWriter } from '../monad-writer';
import { MonadReader } from '../monad-reader';

export type IxRWST<R, W, S1, S2, F, A> = (
  r: R,
  s1: S1,
) => Kind<F, [[A, S2, W]]>;
export const IxRWST = function <R, W, S1, S2, F, A>(
  runIxRSWT: (r: R, s1: S1) => Kind<F, [[A, S2, W]]>,
): IxRWST<R, W, S1, S2, F, A> {
  return runIxRSWT;
};

IxRWST.mapK =
  <F, G>(fk: FunctionK<F, G>) =>
  <R, W, S1, S2, A>(
    f: IxRWST<R, W, S1, S2, F, A>,
  ): IxRWST<R, W, S1, S2, G, A> =>
  (r, s) =>
    fk(f(r, s));

IxRWST.local =
  <R0, R>(f: (r0: R0) => R) =>
  <W, S1, S2, F, A>(
    fa: IxRWST<R, W, S1, S2, F, A>,
  ): IxRWST<R0, W, S1, S2, F, A> =>
    IxRWST.local_(fa, f);
IxRWST.local_ =
  <R0, R, W, S1, S2, F, A>(
    fa: IxRWST<R, W, S1, S2, F, A>,
    f: (r0: R0) => R,
  ): IxRWST<R0, W, S1, S2, F, A> =>
  (r0, s) =>
    fa(f(r0), s);

IxRWST.censor =
  <F>(F: Functor<F>) =>
  <W, W2>(f: (w: W) => W2) =>
  <R, S1, S2, A>(fa: IxRWST<R, W, S1, S2, F, A>): IxRWST<R, W2, S1, S2, F, A> =>
    IxRWST.censor_(F)(fa, f);
IxRWST.censor_ =
  <F>(F: Functor<F>) =>
  <R, W, W2, S1, S2, A>(
    fa: IxRWST<R, W, S1, S2, F, A>,
    f: (w: W) => W2,
  ): IxRWST<R, W2, S1, S2, F, A> =>
    suspend(F, (r, s) => F.map_(fa(r, s), ([a, s, w]) => [a, s, f(w)]));

IxRWST.state =
  <F, W>(F: Applicative<F>, W: Monoid<W>) =>
  <S1, S2, A, R = unknown>(
    f: (s1: S1) => [A, S2],
  ): IxRWST<R, W, S1, S2, F, A> =>
  (r, s) =>
    F.pure([...f(s), W.empty]);
IxRWST.stateF =
  <F, W>(F: Functor<F>, W: Monoid<W>) =>
  <S1, S2, A, R = unknown>(
    f: (s1: S1) => Kind<F, [[A, S2]]>,
  ): IxRWST<R, W, S1, S2, F, A> =>
  (r, s) =>
    F.map_(f(s), ([a, s2]) => [a, s2, W.empty]);

IxRWST.runA =
  <F>(F: Functor<F>) =>
  <R, S1>(r: R, s1: S1) =>
  <A>(fa: IxRWST<R, unknown, S1, unknown, F, A>): Kind<F, [A]> =>
    F.map_(fa(r, s1), ([a]) => a);

IxRWST.runS =
  <F>(F: Functor<F>) =>
  <R, S1>(r: R, s1: S1) =>
  <S2>(fa: IxRWST<R, unknown, S1, S2, F, unknown>): Kind<F, [S2]> =>
    F.map_(fa(r, s1), ([, s2]) => s2);

IxRWST.runW =
  <F>(F: Functor<F>) =>
  <R, S1>(r: R, s: S1) =>
  <W>(fa: IxRWST<R, W, S1, unknown, F, unknown>): Kind<F, [W]> =>
    F.map_(fa(r, s), ([, , w]) => w);

IxRWST.runAS =
  <F>(F: Functor<F>) =>
  <R, S1>(r: R, s1: S1) =>
  <A, S2>(fa: IxRWST<R, unknown, S1, S2, F, A>): Kind<F, [[A, S2]]> =>
    F.map_(fa(r, s1), ([a, s2]) => [a, s2]);

IxRWST.runAW =
  <F>(F: Functor<F>) =>
  <R, S1>(r: R, s1: S1) =>
  <W, A>(fa: IxRWST<R, W, S1, unknown, F, A>): Kind<F, [[A, W]]> =>
    F.map_(fa(r, s1), ([a, , w]) => [a, w]);

IxRWST.runSW =
  <F>(F: Functor<F>) =>
  <R, S1>(r: R, s1: S1) =>
  <S2, W>(fa: IxRWST<R, W, S1, S2, F, unknown>): Kind<F, [[S2, W]]> =>
    F.map_(fa(r, s1), ([, s2, w]) => [s2, w]);

IxRWST.SemigroupK = <R, W, S1, S2, F>(
  F: SemigroupK<F>,
): SemigroupK<$<IxRWSTF, [R, W, S1, S2, F]>> =>
  SemigroupK.of<$<IxRWSTF, [R, W, S1, S2, F]>>({
    combineK_: (x, y) => (r, s1) => F.combineK_(x(r, s1), y(r, s1)),
  });

IxRWST.MonoidK = <R, W, S1, S2, F>(
  F: MonoidK<F>,
): MonoidK<$<IxRWSTF, [R, W, S1, S2, F]>> =>
  MonoidK.of<$<IxRWSTF, [R, W, S1, S2, F]>>({
    emptyK:
      <A>() =>
      () =>
        F.emptyK<A>(),
    combineK_:
      <A>(x: IxRWST<R, W, S1, S2, F, A>, y: IxRWST<R, W, S1, S2, F, A>) =>
      (r, s1) =>
        F.combineK_<[A, S2, W]>(x(r, s1), y(r, s1)),
  });

IxRWST.Profunctor = <R, W, F, A>(
  F: Functor<F>,
): Profunctor<λ<IxRWSTF, [Fix<R>, Fix<W>, α, β, Fix<F>, Fix<A>]>> =>
  Profunctor.of({
    dimap_: <S1, S2, S0, S3>(
      fab: IxRWST<R, W, S1, S2, F, A>,
      f: (s0: S0) => S1,
      g: (s2: S2) => S3,
    ) =>
      suspend(F, (r: R, s: S0) =>
        F.map_(fab(r, f(s)), ([a, s2, w]) => [a, g(s2), w]),
      ),
  });

IxRWST.Strong = <R, W, F, A>(
  F: Functor<F>,
): Strong<λ<IxRWSTF, [Fix<R>, Fix<W>, α, β, Fix<F>, Fix<A>]>> =>
  Strong.of({
    ...IxRWST.Profunctor(F),
    first:
      <C>() =>
      <S1, S2>(fab: IxRWST<R, W, S1, S2, F, A>) =>
        suspend(F, (r, [s1, c]: [S1, C]) =>
          F.map_(fab(r, s1), ([a, s2, w]) => [a, [s2, c], w]),
        ),
    second:
      <C>() =>
      <S1, S2>(fab: IxRWST<R, W, S1, S2, F, A>) =>
        suspend(F, (r, [c, s1]: [C, S1]) =>
          F.map_(fab(r, s1), ([a, s2, w]) => [a, [c, s2], w]),
        ),
  });

IxRWST.Functor = <R, W, S, F>(
  F: Functor<F>,
): Functor<$<IxRWSTF, [R, W, S, S, F]>> =>
  Functor.of<$<IxRWSTF, [R, W, S, S, F]>>({
    map_: (fa, f) =>
      suspend(F, (r, s1) => F.map_(fa(r, s1), ([a, s2, w]) => [f(a), s2, w])),
  });

IxRWST.Apply = <R, W, S, F>(
  W: Monoid<W>,
  F: FlatMap<F>,
): Apply<$<IxRWSTF, [R, W, S, S, F]>> =>
  Apply.of<$<IxRWSTF, [R, W, S, S, F]>>({
    ...IxRWST.Functor(F),
    ap_: (ff, fa) =>
      suspend(F, (r, s1) =>
        F.flatMap_(ff(r, s1), ([f, s2, w1]) =>
          F.map_(fa(r, s2), ([a, s2, w2]) => [f(a), s2, W.combine_(w1, w2)]),
        ),
      ),
  });

IxRWST.FlatMap = <R, W, S, F>(
  W: Monoid<W>,
  F: FlatMap<F>,
): FlatMap<$<IxRWSTF, [R, W, S, S, F]>> =>
  FlatMap.of<$<IxRWSTF, [R, W, S, S, F]>>({
    ...IxRWST.Apply(W, F),
    flatMap_: (fa, f) =>
      suspend(F, (r, s) =>
        F.flatMap_(fa(r, s), ([a, s, w]) =>
          F.map_(f(a)(r, s), ([b, s, w2]) => [b, s, W.combine_(w, w2)]),
        ),
      ),
    tailRecM_: (x, f) => (r, s1) =>
      F.tailRecM_(tupled(x, s1, W.empty), ([x, sx, w]) =>
        F.map_(f(x)(r, sx), ([ea, sx, wx]) =>
          ea.fold(
            x => Left(tupled(x, sx, W.combine_(w, wx))),
            z => Right(tupled(z, sx, W.combine_(w, wx))),
          ),
        ),
      ),
  });

IxRWST.Alternative = <R, W, S, F>(
  W: Monoid<W>,
  F: Monad<F>,
  G: Alternative<F>,
): Monad<$<IxRWSTF, [R, W, S, S, F]>> =>
  Monad.of<$<IxRWSTF, [R, W, S, S, F]>>({
    ...IxRWST.MonoidK(G),
    ...IxRWST.Monad(W, F),
  });

IxRWST.Monad = <R, W, S, F>(
  W: Monoid<W>,
  F: Monad<F>,
): Monad<$<IxRWSTF, [R, W, S, S, F]>> =>
  Monad.of<$<IxRWSTF, [R, W, S, S, F]>>({
    ...IxRWST.FlatMap(W, F),
    pure: a => (r, s) => F.pure([a, s, W.empty]),
  });

IxRWST.MonadError = <R, W, S, F, E>(
  W: Monoid<W>,
  F: MonadError<F, E>,
): MonadError<$<IxRWSTF, [R, W, S, S, F]>, E> =>
  MonadError.of<$<IxRWSTF, [R, W, S, S, F]>, E>({
    ...IxRWST.Monad(W, F),
    throwError:
      <A>(e: E) =>
      () =>
        F.throwError<A>(e),
    handleErrorWith_: (fa, h) =>
      suspend(F, (r, s) => F.handleErrorWith_(fa(r, s), e => h(e)(r, s))),
  });

IxRWST.MonadReader = <R, W, S, F>(
  W: Monoid<W>,
  F: Monad<F>,
): MonadReader<$<IxRWSTF, [R, W, S, S, F]>, R> =>
  MonadReader.of<$<IxRWSTF, [R, W, S, S, F]>, R>({
    ...IxRWST.Monad(W, F),
    ask: () => (r, s) => F.pure([r, s, W.empty]),
    local_: (fa, f) => suspend(F, (r0, s1) => fa(f(r0), s1)),
  });

IxRWST.MonadWriter = <R, W, S, F>(
  W: Monoid<W>,
  F: Monad<F>,
): MonadWriter<$<IxRWSTF, [R, W, S, S, F]>, W> =>
  MonadWriter.of<$<IxRWSTF, [R, W, S, S, F]>, W>({
    ...IxRWST.Monad(W, F),
    monoid: W,
    censor_: (fa, f) =>
      suspend(F, (r, s1) => F.map_(fa(r, s1), ([a, s2, w]) => [a, s2, f(w)])),
    listen: fa =>
      suspend(F, (r, s1) => F.map_(fa(r, s1), ([a, s2, w]) => [[a, w], s2, w])),
    tell: w => (r, s) => F.pure([undefined, s, w]),
  });

IxRWST.MonadState = <R, W, S, F>(
  W: Monoid<W>,
  F: Monad<F>,
): MonadState<$<IxRWSTF, [R, W, S, S, F]>, S> =>
  MonadState.of<$<IxRWSTF, [R, W, S, S, F]>, S>({
    ...IxRWST.Monad(W, F),
    get: (r, s) => F.pure([s, s, W.empty]),
    set: s => (r, s1) => F.pure([undefined, s, W.empty]),
    modify: f => (r, s) => F.pure([undefined, f(s), W.empty]),
    inspect: f => (r, s) => F.pure([f(s), s, W.empty]),
  });

const suspend = <R, W, S1, S2, F, A>(
  F: Functor<F>,
  f: (r: R, s1: S1) => Kind<F, [[A, S2, W]]>,
): IxRWST<R, W, S1, S2, F, A> =>
  isStackSafeMonad(F) ? (r, s1) => F.defer(() => f(r, s1)) : f;

// -- HKT

/**
 * @category Type Constructor
 * @category Data
 */
export interface IxRWSTF
  extends TyK<[unknown, unknown, unknown, unknown, unknown, unknown]> {
  [$type]: IxRWST<
    TyVar<this, 0>,
    TyVar<this, 1>,
    TyVar<this, 2>,
    TyVar<this, 3>,
    TyVar<this, 4>,
    TyVar<this, 5>
  >;
}
