import { $, $type, TyK, TyVar } from '@cats4ts/core';
import { Monoid } from '../../monoid';
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

  SemigroupK<A>(A: Monoid<A>): SemigroupK<$<ConstK, [A]>>;
  MonoidK<A>(A: Monoid<A>): MonoidK<$<ConstK, [A]>>;
  Functor<A>(): Functor<$<ConstK, [A]>>;
  FunctorFilter<A>(): FunctorFilter<$<ConstK, [A]>>;
  Apply<A>(A: Monoid<A>): Apply<$<ConstK, [A]>>;
  Applicative<A>(A: Monoid<A>): Applicative<$<ConstK, [A]>>;
  Foldable<A>(A: Monoid<A>): Foldable<$<ConstK, [A]>>;
  Traversable<A>(A: Monoid<A>): Traversable<$<ConstK, [A]>>;
}

Const.of = of;
Const.pure = pure;
Const.empty = empty;

Const.SemigroupK = constSemigroupK;
Const.MonoidK = constMonoidK;
Const.Functor = constFunctor;
Const.FunctorFilter = constFunctorFilter;
Const.Apply = constApply;
Const.Applicative = constApplicative;
Const.Foldable = constFoldable;
Const.Traversable = constTraversable;

// -- HKT

export interface ConstK extends TyK<[unknown, unknown]> {
  [$type]: Const<TyVar<this, 0>, TyVar<this, 1>>;
}
