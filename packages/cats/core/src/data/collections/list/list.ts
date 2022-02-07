// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $type, TyK, TyVar } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Align } from '../../../align';
import { Apply } from '../../../apply';
import { Applicative } from '../../../applicative';
import { Alternative } from '../../../alternative';
import { Foldable } from '../../../foldable';
import { FlatMap } from '../../../flat-map';
import { Functor } from '../../../functor';
import { FunctorFilter } from '../../../functor-filter';
import { Monad } from '../../../monad';
import { MonoidK } from '../../../monoid-k';
import { SemigroupK } from '../../../semigroup-k';
import { Traversable } from '../../../traversable';

import { Either } from '../../either';
import { Vector } from '../vector';

import { List as ListBase } from './algebra';
import {
  empty,
  fromArray,
  fromIterator,
  fromVector,
  of,
  pure,
  range,
} from './constructors';
import {
  listApplicative,
  listApply,
  listFoldable,
  listFunctor,
  listFunctorFilter,
  listMonoidK,
  listSemigroupK,
  listTraversable,
  listFlatMap,
  listMonad,
  listAlternative,
  listEq,
  listAlign,
} from './instances';
import { tailRecM } from './operators';

export type List<A> = ListBase<A>;

export const List: ListObj = function <A>(...xs: A[]): List<A> {
  return fromArray(xs);
} as any;

interface ListObj {
  <A>(...xs: A[]): List<A>;

  pure: <A>(x: A) => List<A>;
  empty: List<never>;
  of: <A>(...xs: A[]) => List<A>;
  fromArray<A>(xs: A[]): List<A>;
  fromIterator<A>(it: Iterator<A>): List<A>;
  fromVector<A>(xs: Vector<A>): List<A>;
  tailRecM<A>(a: A): <B>(f: (a: A) => List<Either<A, B>>) => List<B>;
  range(from: number, to: number): List<number>;

  // -- Instances

  readonly SemigroupK: SemigroupK<ListK>;
  readonly MonoidK: MonoidK<ListK>;
  readonly Align: Align<ListK>;
  readonly Functor: Functor<ListK>;
  readonly FunctorFilter: FunctorFilter<ListK>;
  readonly Apply: Apply<ListK>;
  readonly Applicative: Applicative<ListK>;
  readonly Alternative: Alternative<ListK>;
  readonly FlatMap: FlatMap<ListK>;
  readonly Monad: Monad<ListK>;
  readonly Foldable: Foldable<ListK>;
  readonly Traversable: Traversable<ListK>;
  Eq<A>(E: Eq<A>): Eq<List<A>>;
}

List.pure = pure;
List.empty = empty;
List.of = of;
List.fromArray = fromArray;
List.fromVector = fromVector;
List.fromIterator = fromIterator;
List.tailRecM = tailRecM;
List.range = range;

Object.defineProperty(List, 'SemigroupK', {
  get(): SemigroupK<ListK> {
    return listSemigroupK();
  },
});
Object.defineProperty(List, 'MonoidK', {
  get(): MonoidK<ListK> {
    return listMonoidK();
  },
});
Object.defineProperty(List, 'Align', {
  get(): Align<ListK> {
    return listAlign();
  },
});
Object.defineProperty(List, 'Functor', {
  get(): Functor<ListK> {
    return listFunctor();
  },
});
Object.defineProperty(List, 'FunctorFilter', {
  get(): FunctorFilter<ListK> {
    return listFunctorFilter();
  },
});
Object.defineProperty(List, 'Apply', {
  get(): Apply<ListK> {
    return listApply();
  },
});
Object.defineProperty(List, 'Applicative', {
  get(): Applicative<ListK> {
    return listApplicative();
  },
});
Object.defineProperty(List, 'Alternative', {
  get(): Alternative<ListK> {
    return listAlternative();
  },
});
Object.defineProperty(List, 'FlatMap', {
  get(): FlatMap<ListK> {
    return listFlatMap();
  },
});
Object.defineProperty(List, 'Monad', {
  get(): Monad<ListK> {
    return listMonad();
  },
});
Object.defineProperty(List, 'Foldable', {
  get(): Foldable<ListK> {
    return listFoldable();
  },
});
Object.defineProperty(List, 'Traversable', {
  get(): Traversable<ListK> {
    return listTraversable();
  },
});
List.Eq = listEq;

// HKT

/**
 * @category Type Constructor
 * @category Collection
 */
export interface ListK extends TyK<[unknown]> {
  [$type]: List<TyVar<this, 0>>;
}
