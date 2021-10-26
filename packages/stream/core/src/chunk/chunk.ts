import { $type, TyK, TyVar } from '@fp4ts/core';
import {
  Alternative,
  Either,
  Functor,
  FunctorFilter,
  Monad,
  MonoidK,
  Traversable,
} from '@fp4ts/cats';

import { Chunk as ChunkBase } from './algebra';
import {
  empty,
  emptyQueue,
  fromArray,
  singleton,
  tailRecM,
  tailRecM_,
} from './constructor';
import {
  chunkAlternative,
  chunkFunctor,
  chunkFunctorFilter,
  chunkMonad,
  chunkMonoidK,
  chunkTraversable,
} from './instances';

export type Chunk<O> = ChunkBase<O>;

export const Chunk: ChunkObj = function <O>(...os: O[]): Chunk<O> {
  return fromArray(os);
} as any;

interface ChunkObj {
  <O>(...os: O[]): Chunk<O>;
  empty: Chunk<never>;
  singleton<O>(o: O): Chunk<O>;
  fromArray<O>(xs: O[]): Chunk<O>;
  emptyQueue: Chunk<never>;

  tailRecM<S>(s: S): <A>(f: (s: S) => Chunk<Either<S, A>>) => Chunk<A>;
  tailRecM_<S, A>(s: S, f: (s: S) => Chunk<Either<S, A>>): Chunk<A>;

  // -- Instances
  readonly MonoidK: MonoidK<ChunkK>;
  readonly Functor: Functor<ChunkK>;
  readonly FunctorFilter: FunctorFilter<ChunkK>;
  readonly Alternative: Alternative<ChunkK>;
  readonly Monad: Monad<ChunkK>;
  readonly Traversable: Traversable<ChunkK>;
}

Chunk.empty = empty;
Chunk.singleton = singleton;
Chunk.fromArray = fromArray;
Chunk.emptyQueue = emptyQueue;
Chunk.tailRecM = tailRecM;
Chunk.tailRecM_ = tailRecM_;

Object.defineProperty(Chunk, 'MonoidK', {
  get(): MonoidK<ChunkK> {
    return chunkMonoidK();
  },
});
Object.defineProperty(Chunk, 'Functor', {
  get(): Functor<ChunkK> {
    return chunkFunctor();
  },
});
Object.defineProperty(Chunk, 'FunctorFilter', {
  get(): FunctorFilter<ChunkK> {
    return chunkFunctorFilter();
  },
});
Object.defineProperty(Chunk, 'Alternative', {
  get(): Alternative<ChunkK> {
    return chunkAlternative();
  },
});
Object.defineProperty(Chunk, 'Monad', {
  get(): Monad<ChunkK> {
    return chunkMonad();
  },
});
Object.defineProperty(Chunk, 'Traversable', {
  get(): Traversable<ChunkK> {
    return chunkTraversable();
  },
});

// -- HKT

export interface ChunkK extends TyK<[unknown]> {
  [$type]: Chunk<TyVar<this, 0>>;
}
