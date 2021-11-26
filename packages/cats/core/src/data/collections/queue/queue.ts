import { $type, TyK, TyVar } from '@fp4ts/core';
import { Align } from '../../../align';
import { Apply } from '../../../apply';
import { Applicative } from '../../../applicative';
import { Alternative } from '../../../alternative';
import { FlatMap } from '../../../flat-map';
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

  readonly SemigroupK: SemigroupK<QueueK>;
  readonly MonoidK: MonoidK<QueueK>;
  readonly Align: Align<QueueK>;
  readonly Functor: Functor<QueueK>;
  readonly FunctorFilter: FunctorFilter<QueueK>;
  readonly Apply: Apply<QueueK>;
  readonly Applicative: Applicative<QueueK>;
  readonly FlatMap: FlatMap<QueueK>;
  readonly Alternative: Alternative<QueueK>;
  readonly Monad: Monad<QueueK>;
  readonly Foldable: Foldable<QueueK>;
  readonly Traversable: Traversable<QueueK>;
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
  get(): SemigroupK<QueueK> {
    return queueSemigroupK();
  },
});
Object.defineProperty(Queue, 'MonoidK', {
  get(): MonoidK<QueueK> {
    return queueMonoidK();
  },
});
Object.defineProperty(Queue, 'Align', {
  get(): Align<QueueK> {
    return queueAlign();
  },
});
Object.defineProperty(Queue, 'Functor', {
  get(): Functor<QueueK> {
    return queueFunctor();
  },
});
Object.defineProperty(Queue, 'FunctorFilter', {
  get(): FunctorFilter<QueueK> {
    return queueFunctorFilter();
  },
});
Object.defineProperty(Queue, 'Apply', {
  get(): Apply<QueueK> {
    return queueApply();
  },
});
Object.defineProperty(Queue, 'Applicative', {
  get(): Applicative<QueueK> {
    return queueApplicative();
  },
});
Object.defineProperty(Queue, 'FlatMap', {
  get(): FlatMap<QueueK> {
    return queueFlatMap();
  },
});
Object.defineProperty(Queue, 'Alternative', {
  get(): Alternative<QueueK> {
    return queueAlternative();
  },
});
Object.defineProperty(Queue, 'Monad', {
  get(): Monad<QueueK> {
    return queueMonad();
  },
});
Object.defineProperty(Queue, 'Foldable', {
  get(): Foldable<QueueK> {
    return queueFoldable();
  },
});
Object.defineProperty(Queue, 'Traversable', {
  get(): Traversable<QueueK> {
    return queueTraversable();
  },
});

// -- HKT

/**
 * @category Type Constructor
 * @category Collection
 */
export interface QueueK extends TyK<[unknown]> {
  [$type]: Queue<TyVar<this, 0>>;
}
