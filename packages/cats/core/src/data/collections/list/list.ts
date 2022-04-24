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
import { CoflatMap } from '../../../coflat-map';
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
  cons,
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
  listCoflatMap,
} from './instances';
import { tailRecM } from './operators';

export type List<A> = ListBase<A>;

export const List: ListObj = function <A>(...xs: A[]): List<A> {
  return fromArray(xs);
} as any;

interface ListObj {
  <A>(...xs: A[]): List<A>;

  cons<A>(head: A, tail: List<A>): List<A>;

  pure: <A>(x: A) => List<A>;
  empty: List<never>;
  of: <A>(...xs: A[]) => List<A>;
  fromArray<A>(xs: A[]): List<A>;
  fromIterator<A>(it: Iterator<A>): List<A>;
  fromVector<A>(xs: Vector<A>): List<A>;
  tailRecM<A>(a: A): <B>(f: (a: A) => List<Either<A, B>>) => List<B>;
  range(from: number, to: number): List<number>;

  // -- Instances

  readonly SemigroupK: SemigroupK<ListF>;
  readonly MonoidK: MonoidK<ListF>;
  readonly Align: Align<ListF>;
  readonly Functor: Functor<ListF>;
  readonly FunctorFilter: FunctorFilter<ListF>;
  readonly Apply: Apply<ListF>;
  readonly Applicative: Applicative<ListF>;
  readonly Alternative: Alternative<ListF>;
  readonly FlatMap: FlatMap<ListF>;
  readonly CoflatMap: CoflatMap<ListF>;
  readonly Monad: Monad<ListF>;
  readonly Foldable: Foldable<ListF>;
  readonly Traversable: Traversable<ListF>;
  Eq<A>(E: Eq<A>): Eq<List<A>>;
}

List.cons = cons;
List.pure = pure;
List.empty = empty;
List.of = of;
List.fromArray = fromArray;
List.fromVector = fromVector;
List.fromIterator = fromIterator;
List.tailRecM = tailRecM;
List.range = range;

Object.defineProperty(List, 'SemigroupK', {
  get(): SemigroupK<ListF> {
    return listSemigroupK();
  },
});
Object.defineProperty(List, 'MonoidK', {
  get(): MonoidK<ListF> {
    return listMonoidK();
  },
});
Object.defineProperty(List, 'Align', {
  get(): Align<ListF> {
    return listAlign();
  },
});
Object.defineProperty(List, 'Functor', {
  get(): Functor<ListF> {
    return listFunctor();
  },
});
Object.defineProperty(List, 'FunctorFilter', {
  get(): FunctorFilter<ListF> {
    return listFunctorFilter();
  },
});
Object.defineProperty(List, 'Apply', {
  get(): Apply<ListF> {
    return listApply();
  },
});
Object.defineProperty(List, 'Applicative', {
  get(): Applicative<ListF> {
    return listApplicative();
  },
});
Object.defineProperty(List, 'Alternative', {
  get(): Alternative<ListF> {
    return listAlternative();
  },
});
Object.defineProperty(List, 'FlatMap', {
  get(): FlatMap<ListF> {
    return listFlatMap();
  },
});
Object.defineProperty(List, 'CoflatMap', {
  get(): CoflatMap<ListF> {
    return listCoflatMap();
  },
});
Object.defineProperty(List, 'Monad', {
  get(): Monad<ListF> {
    return listMonad();
  },
});
Object.defineProperty(List, 'Foldable', {
  get(): Foldable<ListF> {
    return listFoldable();
  },
});
Object.defineProperty(List, 'Traversable', {
  get(): Traversable<ListF> {
    return listTraversable();
  },
});
List.Eq = listEq;

// HKT

/**
 * @category Type Constructor
 * @category Collection
 */
export interface ListF extends TyK<[unknown]> {
  [$type]: List<TyVar<this, 0>>;
}
