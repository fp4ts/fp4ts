// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $type, HKT, TyK, TyVar } from '@fp4ts/core';
import { Align } from '../../../align';
import { Apply } from '../../../apply';
import { Applicative } from '../../../applicative';
import { Alternative } from '../../../alternative';
import { FlatMap } from '../../../flat-map';
import { CoflatMap } from '../../../coflat-map';
import { Functor } from '../../../functor';
import { FunctorFilter } from '../../../functor-filter';
import { Foldable } from '../../../foldable';
import { Monad } from '../../../monad';
import { MonoidK } from '../../../monoid-k';
import { SemigroupK } from '../../../semigroup-k';
import { Traversable } from '../../../traversable';

import { Either } from '../../either';
import { List } from '../list';
import { Vector } from '../vector';

import { Queue as QueueBase } from './algebra';
import {
  empty,
  fromArray,
  fromIterator,
  fromList,
  fromVector,
  of,
  pure,
  singleton,
  tailRecM,
} from './constructors';
import {
  queueAlign,
  queueAlternative,
  queueApplicative,
  queueApply,
  queueCoflatMap,
  queueFlatMap,
  queueFoldable,
  queueFunctor,
  queueFunctorFilter,
  queueMonad,
  queueMonoidK,
  queueSemigroupK,
  queueTraversable,
} from './instances';

export type Queue<A> = QueueBase<A>;

export const Queue: QueueObj = function <A>(...xs: A[]): Queue<A> {
  return fromArray(xs);
} as any;

interface QueueObj {
  <A>(...xs: A[]): Queue<A>;
  singleton<A>(a: A): Queue<A>;
  pure<A>(a: A): Queue<A>;
  readonly empty: Queue<never>;
  of<A>(...as: A[]): Queue<A>;
  fromArray<A>(as: A[]): Queue<A>;
  fromList<A>(as: List<A>): Queue<A>;
  fromVector<A>(as: Vector<A>): Queue<A>;
  fromIterator<A>(it: Iterator<A>): Queue<A>;
  tailRecM<S>(s: S): <A>(f: (s: S) => Queue<Either<S, A>>) => Queue<A>;

  // -- Instances

  readonly SemigroupK: SemigroupK<QueueF>;
  readonly MonoidK: MonoidK<QueueF>;
  readonly Align: Align<QueueF>;
  readonly Functor: Functor<QueueF>;
  readonly FunctorFilter: FunctorFilter<QueueF>;
  readonly Apply: Apply<QueueF>;
  readonly Applicative: Applicative<QueueF>;
  readonly FlatMap: FlatMap<QueueF>;
  readonly CoflatMap: CoflatMap<QueueF>;
  readonly Alternative: Alternative<QueueF>;
  readonly Monad: Monad<QueueF>;
  readonly Foldable: Foldable<QueueF>;
  readonly Traversable: Traversable<QueueF>;
}
Queue.singleton = singleton;
Queue.pure = pure;
Object.defineProperty(Queue, 'empty', {
  get(): Queue<never> {
    return empty;
  },
});
Queue.of = of;
Queue.fromArray = fromArray;
Queue.fromList = fromList;
Queue.fromVector = fromVector;
Queue.fromIterator = fromIterator;
Queue.tailRecM = tailRecM;

Object.defineProperty(Queue, 'SemigroupK', {
  get(): SemigroupK<QueueF> {
    return queueSemigroupK();
  },
});
Object.defineProperty(Queue, 'MonoidK', {
  get(): MonoidK<QueueF> {
    return queueMonoidK();
  },
});
Object.defineProperty(Queue, 'Align', {
  get(): Align<QueueF> {
    return queueAlign();
  },
});
Object.defineProperty(Queue, 'Functor', {
  get(): Functor<QueueF> {
    return queueFunctor();
  },
});
Object.defineProperty(Queue, 'FunctorFilter', {
  get(): FunctorFilter<QueueF> {
    return queueFunctorFilter();
  },
});
Object.defineProperty(Queue, 'Apply', {
  get(): Apply<QueueF> {
    return queueApply();
  },
});
Object.defineProperty(Queue, 'Applicative', {
  get(): Applicative<QueueF> {
    return queueApplicative();
  },
});
Object.defineProperty(Queue, 'FlatMap', {
  get(): FlatMap<QueueF> {
    return queueFlatMap();
  },
});
Object.defineProperty(Queue, 'CoflatMap', {
  get(): CoflatMap<QueueF> {
    return queueCoflatMap();
  },
});
Object.defineProperty(Queue, 'Alternative', {
  get(): Alternative<QueueF> {
    return queueAlternative();
  },
});
Object.defineProperty(Queue, 'Monad', {
  get(): Monad<QueueF> {
    return queueMonad();
  },
});
Object.defineProperty(Queue, 'Foldable', {
  get(): Foldable<QueueF> {
    return queueFoldable();
  },
});
Object.defineProperty(Queue, 'Traversable', {
  get(): Traversable<QueueF> {
    return queueTraversable();
  },
});

// -- HKT

declare module './algebra' {
  export interface Queue<A> extends HKT<QueueF, [A]> {}
}

/**
 * @category Type Constructor
 * @category Collection
 */
export interface QueueF extends TyK<[unknown]> {
  [$type]: Queue<TyVar<this, 0>>;
}
