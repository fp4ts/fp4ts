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
}

const cokleisliSemigroupK: <F>(
  F: CoflatMap<F>,
) => SemigroupK<λ<CokleisliF, [Fix<F>, α, α]>> = F =>
  SemigroupK.of({ combineK_: (x, y) => F1.andThen(F.coflatMap(x), y) });

const cokleisliMonoidK: <F>(
  F: Comonad<F>,
) => MonoidK<λ<CokleisliF, [Fix<F>, α, α]>> = F =>
  MonoidK.of({
    combineK_: (x, y) => F1.andThen(F.coflatMap(x), y),
    // eslint-disable-next-line prettier/prettier
    emptyK: <A>() => (F).extract<A>,
  });

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
          while (cur.isLeft()) {
            cur = f(cur.getLeft)(fa);
          }
          return cur.get;
        }),
    }),
);

Cokleisli.SemigroupK = cokleisliSemigroupK;
Cokleisli.MonoidK = cokleisliMonoidK;
Cokleisli.Functor = cokleisliFunctor;
Cokleisli.Contravariant = cokleisliContravariant;
Cokleisli.MonadDefer = cokleisliMonadDefer;

// -- HKT

/**
 * @category Type Constructor
 * @category Data
 */
export interface CokleisliF extends TyK<[unknown, unknown, unknown]> {
  [$type]: Cokleisli<TyVar<this, 0>, TyVar<this, 1>, TyVar<this, 2>>;
}
