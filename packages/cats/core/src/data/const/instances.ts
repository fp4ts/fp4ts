// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Kind, lazyVal } from '@fp4ts/core';
import { Semigroup, Monoid, Eq } from '@fp4ts/cats-kernel';
import { EqK } from '../../eq-k';
import { SemigroupK } from '../../semigroup-k';
import { MonoidK } from '../../monoid-k';
import { Functor } from '../../functor';
import { FunctorFilter } from '../../functor-filter';
import { Apply } from '../../apply';
import { Applicative } from '../../applicative';
import { Foldable } from '../../foldable';
import { Traversable } from '../../traversable';

import { Const, ConstF } from './const';
import { combine_, retag } from './operators';
import { pure } from './constructors';
import { Contravariant } from '../../contravariant';

export const constEqK: <A>(E: Eq<A>) => EqK<$<ConstF, [A]>> = E =>
  EqK.of({ liftEq: () => E });

export const constSemigroupK: <A>(
  A: Semigroup<A>,
) => SemigroupK<$<ConstF, [A]>> = A =>
  SemigroupK.of({ combineK_: (x, y) => A.combine_(x, y) });

export const constMonoidK: <A>(A: Monoid<A>) => MonoidK<$<ConstF, [A]>> = A =>
  MonoidK.of({
    emptyK: () => A.empty,
    combineK_: (x, y) => A.combine_(x, y),
  });

export const constFunctor: <A>() => Functor<$<ConstF, [A]>> = lazyVal(<A>() =>
  Functor.of({ map_: retag<A>() }),
);

export const constContravariant: <A>() => Contravariant<$<ConstF, [A]>> =
  lazyVal(<A>() => Contravariant.of({ contramap_: retag<A>() }));

export const constFunctorFilter: <A>() => FunctorFilter<$<ConstF, [A]>> =
  lazyVal(<A>() =>
    FunctorFilter.of({ ...constFunctor(), mapFilter_: retag<A>() }),
  );

export const constApply: <A>(A: Monoid<A>) => Apply<$<ConstF, [A]>> = <A>(
  A: Monoid<A>,
) =>
  Apply.of({
    ...constFunctor<A>(),
    ap_: (ff, fc) => combine_(A)(ff, fc),
  });

export const constApplicative: <A>(
  A: Monoid<A>,
) => Applicative<$<ConstF, [A]>> = <A>(A: Monoid<A>) =>
  Applicative.of({
    ...constFunctor<A>(),
    ...constApply(A),
    pure: pure(A),
  });

export const constFoldable: <A>() => Foldable<$<ConstF, [A]>> = lazyVal(() =>
  Foldable.of({
    foldMap_:
      <M>(M: Monoid<M>) =>
      () =>
        M.empty,
  }),
);

export const constTraversable: <A>() => Traversable<$<ConstF, [A]>> = lazyVal(<
  A,
>() =>
  Traversable.of({
    ...constFunctor<A>(),
    ...constFoldable<A>(),

    traverse_:
      <G>(G: Applicative<G>) =>
      <B, C>(fa: Const<A, B>, f: (x: B) => Kind<G, [C]>) =>
        G.pure(fa),
  }),
) as <A>() => Traversable<$<ConstF, [A]>>;
