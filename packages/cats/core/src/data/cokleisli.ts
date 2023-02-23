// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  $,
  $type,
  cached,
  constant,
  Fix,
  F1,
  fst,
  Kind,
  lazy,
  pipe,
  snd,
  TyK,
  TyVar,
  α,
  λ,
} from '@fp4ts/core';
import { Arrow, Compose, Profunctor } from '../arrow';
import { CoflatMap } from '../coflat-map';
import { Comonad } from '../comonad';
import { Contravariant } from '../contravariant';
import { Functor } from '../functor';
import { MonadDefer } from '../monad-defer';
import { MonoidK } from '../monoid-k';
import { SemigroupK } from '../semigroup-k';

export type Cokleisli<F, A, B> = (fa: Kind<F, [A]>) => B;

export const Cokleisli: CokleisliObj = function (f) {
  return f;
};

interface CokleisliObj {
  <F, A, B>(f: (fa: Kind<F, [A]>) => B): Cokleisli<F, A, B>;

  SemigroupK<F>(F: CoflatMap<F>): SemigroupK<λ<CokleisliF, [Fix<F>, α, α]>>;
  MonoidK<F>(F: Comonad<F>): MonoidK<λ<CokleisliF, [Fix<F>, α, α]>>;
  Functor<F, A>(): Functor<$<CokleisliF, [F, A]>>;
  Contravariant<F, B>(
    F: Functor<F>,
  ): Contravariant<λ<CokleisliF, [Fix<F>, α, Fix<B>]>>;
  MonadDefer<F, A>(): MonadDefer<$<CokleisliF, [F, A]>>;

  Profunctor<F>(F: Functor<F>): Profunctor<$<CokleisliF, [F]>>;
  Compose<F>(F: CoflatMap<F>): Compose<$<CokleisliF, [F]>>;
  Arrow<F>(F: Comonad<F>): Arrow<$<CokleisliF, [F]>>;
}

const cokleisliSemigroupK: <F>(
  F: CoflatMap<F>,
) => SemigroupK<λ<CokleisliF, [Fix<F>, α, α]>> = F =>
  cokleisliCompose(F).algebraK();

const cokleisliMonoidK: <F>(
  F: Comonad<F>,
) => MonoidK<λ<CokleisliF, [Fix<F>, α, α]>> = F => cokleisliArrow(F).algebraK();

const cokleisliFunctor: <F, R>() => Functor<$<CokleisliF, [F, R]>> = lazy(() =>
  Functor.of({ map_: F1.andThen }),
);

const cokleisliContravariant: <F, B>(
  F: Functor<F>,
) => Contravariant<λ<CokleisliF, [Fix<F>, α, Fix<B>]>> = cached(F =>
  Contravariant.of({ contramap_: (fa, f) => F1.compose(fa, F.map(f)) }),
);

const cokleisliMonadDefer: <F, A>() => MonadDefer<$<CokleisliF, [F, A]>> = lazy(
  () =>
    MonadDefer.of({
      ...cokleisliFunctor(),
      defer: F1.defer,
      pure: constant,
      flatMap_: F1.flatMap,
      tailRecM_: (s, f) =>
        Cokleisli(fa => {
          let cur = f(s)(fa);
          while (cur.isLeft) {
            cur = f(cur.getLeft)(fa);
          }
          return cur.get;
        }),
    }),
);

const cokleisliProfunctor: <F>(
  F: Functor<F>,
) => Profunctor<$<CokleisliF, [F]>> = cached(<F>(F: Functor<F>) =>
  Profunctor.of<$<CokleisliF, [F]>>({
    dimap_: (fa, f, g) => F1.andThen(F1.compose(fa, F.map(f)), g),
    lmap_: <A, B, C>(fa: Cokleisli<F, A, B>, f: (c: C) => A) =>
      cokleisliContravariant<F, B>(F).contramap_(fa, f),
    rmap_: <A, B, D>(fa: Cokleisli<F, A, B>, g: (b: B) => D) =>
      cokleisliFunctor<F, A>().map_(fa, g),
  }),
);

const cokleisliCompose: <F>(F: CoflatMap<F>) => Compose<$<CokleisliF, [F]>> =
  cached(<F>(F: CoflatMap<F>) =>
    Compose.of<$<CokleisliF, [F]>>({
      compose_: <A, B, C>(fbc: Cokleisli<F, B, C>, fab: Cokleisli<F, A, B>) =>
        F1.andThen(F.coflatMap(fab), fbc),
    }),
  );

const cokleisliArrow: <F>(F: Comonad<F>) => Arrow<$<CokleisliF, [F]>> = cached(
  <F>(F: Comonad<F>) =>
    Arrow.of<$<CokleisliF, [F]>>({
      lift:
        <A, B>(f: (a: A) => B) =>
        (fa: Kind<F, [A]>) =>
          f(F.extract(fa)),
      first:
        <C>() =>
        <A, B>(ck: Cokleisli<F, A, B>) =>
        (fac: Kind<F, [[A, C]]>) =>
          [pipe(fac, F.map(fst), ck), pipe(fac, F.map(snd), F.extract)],
      second:
        <C>() =>
        <A, B>(ck: Cokleisli<F, A, B>) =>
        (fca: Kind<F, [[C, A]]>) =>
          [pipe(fca, F.map(fst), F.extract), pipe(fca, F.map(snd), ck)],
      id:
        <A>() =>
        (fa: Kind<F, [A]>) =>
          F.extract(fa),
      compose_: cokleisliCompose(F).compose_,
      andThen_: cokleisliCompose(F).andThen_,
    }),
);

Cokleisli.SemigroupK = cokleisliSemigroupK;
Cokleisli.MonoidK = cokleisliMonoidK;
Cokleisli.Functor = cokleisliFunctor;
Cokleisli.Contravariant = cokleisliContravariant;
Cokleisli.MonadDefer = cokleisliMonadDefer;
Cokleisli.Profunctor = cokleisliProfunctor;
Cokleisli.Compose = cokleisliCompose;
Cokleisli.Arrow = cokleisliArrow;

// -- HKT

/**
 * @category Type Constructor
 * @category Data
 */
export interface CokleisliF extends TyK<[unknown, unknown, unknown]> {
  [$type]: Cokleisli<TyVar<this, 0>, TyVar<this, 1>, TyVar<this, 2>>;
}
