import { $, TyK, _ } from '@cats4ts/core';
import { Monoid } from '../../monoid';
import { SemigroupK } from '../../semigroup-k';
import { MonoidK } from '../../monoid-k';
import { Functor } from '../../functor';
import { FunctorFilter } from '../../functor-filter';
import { Apply } from '../../apply';
import { Applicative } from '../../applicative';
import { FlatMap } from '../../flat-map';
import { Monad } from '../../monad';
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

const ConstURI = '@cats4ts/cats/core/data/const';
type ConstURI = typeof ConstURI;
export type ConstK = TyK<ConstURI, [_, _]>;

declare module '@cats4ts/core/lib/hkt/hkt' {
  interface URItoKind<Tys extends unknown[]> {
    [ConstURI]: Const<Tys[0], Tys[1]>;
  }
}
