// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, TyK, TyVar } from '@fp4ts/core';
import { Eq, Monoid } from '@fp4ts/cats-kernel';
import { EqK } from '../../eq-k';
import { SemigroupK } from '../../semigroup-k';
import { MonoidK } from '../../monoid-k';
import { Functor } from '../../functor';
import { FunctorFilter } from '../../functor-filter';
import { Apply } from '../../apply';
import { Applicative } from '../../applicative';
import { Foldable } from '../../foldable';
import { Traversable } from '../../traversable';

import { empty, of, pure } from './constructors';
import {
  constApplicative,
  constApply,
  constEqK,
  constFoldable,
  constFunctor,
  constFunctorFilter,
  constMonoidK,
  constSemigroupK,
  constTraversable,
} from './instances';

export type Const<A, B> = A;

export const Const: ConstObj = function <A, B>(a: A): Const<A, B> {
  return a;
};

interface ConstObj {
  <A, B>(a: A): Const<A, B>;
  of<A, B>(a: A): Const<A, B>;
  pure<A>(A: Monoid<A>): <B>(x: B) => Const<A, B>;
  empty<A>(A: Monoid<A>): Const<A, never>;

  // -- Instances

  EqK<A>(E: Eq<A>): EqK<$<ConstF, [A]>>;
  SemigroupK<A>(A: Monoid<A>): SemigroupK<$<ConstF, [A]>>;
  MonoidK<A>(A: Monoid<A>): MonoidK<$<ConstF, [A]>>;
  Functor<A>(): Functor<$<ConstF, [A]>>;
  FunctorFilter<A>(): FunctorFilter<$<ConstF, [A]>>;
  Apply<A>(A: Monoid<A>): Apply<$<ConstF, [A]>>;
  Applicative<A>(A: Monoid<A>): Applicative<$<ConstF, [A]>>;
  Foldable<A>(): Foldable<$<ConstF, [A]>>;
  Traversable<A>(): Traversable<$<ConstF, [A]>>;
}

Const.of = of;
Const.pure = pure;
Const.empty = empty;

Const.EqK = constEqK;
Const.SemigroupK = constSemigroupK;
Const.MonoidK = constMonoidK;
Const.Functor = constFunctor;
Const.FunctorFilter = constFunctorFilter;
Const.Apply = constApply;
Const.Applicative = constApplicative;
Const.Foldable = constFoldable;
Const.Traversable = constTraversable;

// -- HKT

/**
 * @category Type Constructor
 * @category Data
 */
export interface ConstF extends TyK<[unknown, unknown]> {
  [$type]: Const<TyVar<this, 0>, TyVar<this, 1>>;
}
