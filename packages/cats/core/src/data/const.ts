// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, constant, Kind, lazy, TyK, TyVar } from '@fp4ts/core';
import { Eq, Monoid, Semigroup } from '@fp4ts/cats-kernel';
import { Applicative } from '../applicative';
import { Apply } from '../apply';
import { Contravariant } from '../contravariant';
import { EqK } from '../eq-k';
import { Foldable } from '../foldable';
import { Functor } from '../functor';
import { FunctorFilter } from '../functor-filter';
import { MonoidK } from '../monoid-k';
import { SemigroupK } from '../semigroup-k';
import { TraversableFilter } from '../traversable-filter';
import { Option } from './option';
import { Traversable } from '../traversable';
import { Monad } from '../monad';
import { FlatMap } from '../flat-map';

export type Const<A, B> = A;

export const Const: ConstObj = function <A, B>(a: A): Const<A, B> {
  return a;
};

interface ConstObj {
  <A, B>(a: A): Const<A, B>;
  pure<A>(A: Monoid<A>): <B>(x: B) => Const<A, B>;
  empty<A>(A: Monoid<A>): Const<A, never>;

  // -- Instances

  EqK<A>(E: Eq<A>): EqK<$<ConstF, [A]>>;
  SemigroupK<A>(A: Monoid<A>): SemigroupK<$<ConstF, [A]>>;
  MonoidK<A>(A: Monoid<A>): MonoidK<$<ConstF, [A]>>;
  Functor<A>(): Functor<$<ConstF, [A]>>;
  FunctorFilter<A>(): FunctorFilter<$<ConstF, [A]>>;
  Contravariant<A>(): Contravariant<$<ConstF, [A]>>;
  Apply<A>(A: Monoid<A>): Apply<$<ConstF, [A]>>;
  Applicative<A>(A: Monoid<A>): Applicative<$<ConstF, [A]>>;
  Foldable<A>(): Foldable<$<ConstF, [A]>>;
  TraversableFilter<A>(): TraversableFilter<$<ConstF, [A]>>;
}

const ConstSymbol = Symbol('@fp4ts/cats/core/data/Const');
export function isConstTC(TC: Traversable<any>): TC is Traversable<ConstF>;
export function isConstTC(TC: Foldable<any>): TC is Foldable<ConstF>;
export function isConstTC(TC: Monad<any>): TC is Monad<ConstF>;
export function isConstTC(TC: Applicative<any>): TC is Applicative<ConstF>;
export function isConstTC(TC: FlatMap<any>): TC is FlatMap<ConstF>;
export function isConstTC(TC: Apply<any>): TC is Apply<ConstF>;
export function isConstTC(TC: Functor<any>): TC is Functor<ConstF>;
export function isConstTC(
  TC: Functor<any> | Foldable<any>,
): TC is Functor<ConstF> | Foldable<ConstF> {
  return ConstSymbol in TC;
}

const constEqK: <A>(E: Eq<A>) => EqK<$<ConstF, [A]>> = E =>
  EqK.of({ liftEq: () => E });

const constSemigroupK: <A>(A: Semigroup<A>) => SemigroupK<$<ConstF, [A]>> = A =>
  SemigroupK.of({ combineK_: (x, y) => A.combine_(x, y) });

const constMonoidK: <A>(A: Monoid<A>) => MonoidK<$<ConstF, [A]>> = A =>
  MonoidK.of({
    emptyK: () => A.empty,
    combineK_: (x, y) => A.combine_(x, y),
  });

const constFunctor: <A>() => Functor<$<ConstF, [A]>> = lazy(<A>() => ({
  [ConstSymbol]: true,
  ...Functor.of({ map_: (fa, f) => fa }),
}));

const constContravariant: <A>() => Contravariant<$<ConstF, [A]>> = lazy(() => ({
  [ConstSymbol]: true,
  ...Contravariant.of({ contramap_: (fa, f) => fa }),
}));

const constFunctorFilter: <A>() => FunctorFilter<$<ConstF, [A]>> = lazy(() => ({
  [ConstSymbol]: true,
  ...FunctorFilter.of({ ...constFunctor(), mapFilter_: (fa, f) => fa }),
}));

const constApply: <E>(E: Monoid<E>) => Apply<$<ConstF, [E]>> = <E>(
  E: Monoid<E>,
) => ({
  [ConstSymbol]: true,
  ...Apply.of({
    ...constFunctor<E>(),
    ap_: (ff, fc) => E.combine_(ff, fc),
    map2_: (fa, fb, f) => E.combine_(fa, fb),
    map2Eval_: (fa, efb, f) => E.combineEval_(fa, efb),
    product_: (fa, fb) => E.combine_(fa, fb),
  }),
});

const constApplicative: <A>(A: Monoid<A>) => Applicative<$<ConstF, [A]>> = <A>(
  A: Monoid<A>,
) => ({
  [ConstSymbol]: true,
  ...Applicative.of({
    ...constFunctor<A>(),
    ...constApply(A),
    pure: constant(A.empty),
  }),
});

const constFoldable: <A>() => Foldable<$<ConstF, [A]>> = lazy(() => ({
  [ConstSymbol]: true,
  ...Foldable.of({ foldRight_: (fa, ez, f) => ez }),
}));

const constTraversableFilter: <A>() => TraversableFilter<$<ConstF, [A]>> = lazy(
  <A>() => ({
    [ConstSymbol]: true,
    ...TraversableFilter.of({
      ...constFunctor<A>(),
      ...constFoldable<A>(),

      traverse_:
        <G>(G: Applicative<G>) =>
        <B, C>(fa: Const<A, B>, f: (x: B) => Kind<G, [C]>) =>
          G.pure(fa),

      traverseFilter_:
        <G>(G: Applicative<G>) =>
        <B, C>(fa: Const<A, B>, f: (x: B) => Kind<G, [Option<C>]>) =>
          G.pure(fa),
    }),
  }),
) as <A>() => TraversableFilter<$<ConstF, [A]>>;

Const.pure = M => constant(M.empty);
Const.empty = M => M.empty;

Const.EqK = constEqK;
Const.SemigroupK = constSemigroupK;
Const.MonoidK = constMonoidK;
Const.Functor = constFunctor;
Const.FunctorFilter = constFunctorFilter;
Const.Contravariant = constContravariant;
Const.Apply = constApply;
Const.Applicative = constApplicative;
Const.Foldable = constFoldable;
Const.TraversableFilter = constTraversableFilter;

// -- HKT

/**
 * @category Type Constructor
 * @category Data
 */
export interface ConstF extends TyK<[unknown, unknown]> {
  [$type]: Const<TyVar<this, 0>, TyVar<this, 1>>;
}
