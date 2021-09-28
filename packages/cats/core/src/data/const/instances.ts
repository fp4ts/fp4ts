import { $, AnyK, Kind } from '@cats4ts/core';
import { Semigroup } from '../../semigroup';
import { Monoid } from '../../monoid';
import { SemigroupK } from '../../semigroup-k';
import { MonoidK } from '../../monoid-k';
import { Functor } from '../../functor';
import { FunctorFilter } from '../../functor-filter';
import { Apply } from '../../apply';
import { Applicative } from '../../applicative';
import { Foldable } from '../../foldable';
import { Traversable } from '../../traversable';

import { Const, ConstK } from './const';
import { combine_, retag } from './operators';
import { pure } from './constructors';

export const constSemigroupK: <A>(
  A: Semigroup<A>,
) => SemigroupK<$<ConstK, [A]>> = A =>
  SemigroupK.of({ combineK_: (x, y) => A.combine_(x, y) });

export const constMonoidK: <A>(A: Monoid<A>) => MonoidK<$<ConstK, [A]>> = A =>
  MonoidK.of({
    emptyK: () => A.empty,
    combineK_: (x, y) => A.combine_(x, y),
  });

export const constFunctor: <A>() => Functor<$<ConstK, [A]>> = <A>() =>
  Functor.of({ map_: retag<A>() });

export const constFunctorFilter: <A>() => FunctorFilter<$<ConstK, [A]>> = <
  A,
>() => FunctorFilter.of({ ...constFunctor(), mapFilter_: retag<A>() });

export const constApply: <A>(A: Monoid<A>) => Apply<$<ConstK, [A]>> = <A>(
  A: Monoid<A>,
) =>
  Apply.of({
    ...constFunctor<A>(),
    ap_: (ff, fc) => combine_(A)(ff, fc),
  });

export const constApplicative: <A>(
  A: Monoid<A>,
) => Applicative<$<ConstK, [A]>> = <A>(A: Monoid<A>) =>
  Applicative.of({
    ...constFunctor<A>(),
    ...constApply(A),
    pure: pure(A),
  });

export const constFoldable: <A>() => Foldable<$<ConstK, [A]>> = () =>
  Foldable.of({ foldLeft_: (_, z) => z, foldRight_: (_, ez) => ez });

export const constTraversable: <A>() => Traversable<$<ConstK, [A]>> = <A>() =>
  Traversable.of({
    ...constFunctor<A>(),
    ...constFoldable<A>(),

    traverse_:
      <G extends AnyK>(G: Applicative<G>) =>
      <B, C>(fa: Const<A, B>, f: (x: B) => Kind<G, [C]>) =>
        G.pure(fa),
  });
