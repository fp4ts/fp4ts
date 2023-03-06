// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $type, Byte, Char, HKT, TyK, TyVar } from '@fp4ts/core';
import {
  Alternative,
  Either,
  Functor,
  FunctorFilter,
  Monad,
  MonoidK,
  Traversable,
} from '@fp4ts/cats';
import { List, Vector } from '@fp4ts/collections';

import { ChainChunk, Chunk as ChunkBase } from './algebra';
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
  return ChunkBase.fromArray(os);
} as any;

interface ChunkObj {
  <O>(...os: O[]): Chunk<O>;
  empty: Chunk<never>;
  singleton<O>(o: O): Chunk<O>;
  fromArray<O>(xs: O[]): Chunk<O>;
  fromList<O>(xs: List<O>): Chunk<O>;
  fromVector<O>(xs: Vector<O>): Chunk<O>;
  emptyChain: ChainChunk<never>;
  fromString(str: string): Chunk<Char>;
  fromBuffer(
    buffer: ArrayBufferLike | Buffer | DataView | Uint8Array | string,
  ): Chunk<Byte>;

  tailRecM<S>(s: S): <A>(f: (s: S) => Chunk<Either<S, A>>) => Chunk<A>;
  tailRecM_<S, A>(s: S, f: (s: S) => Chunk<Either<S, A>>): Chunk<A>;

  // -- Instances
  readonly MonoidK: MonoidK<ChunkF>;
  readonly Functor: Functor<ChunkF>;
  readonly FunctorFilter: FunctorFilter<ChunkF>;
  readonly Alternative: Alternative<ChunkF>;
  readonly Monad: Monad<ChunkF>;
  readonly Traversable: Traversable<ChunkF>;
}

Chunk.empty = ChunkBase.empty;
Chunk.singleton = ChunkBase.singleton;
Chunk.fromArray = ChunkBase.fromArray;
Chunk.fromList = ChunkBase.fromList;
Chunk.fromVector = ChunkBase.fromVector;
Chunk.emptyChain = ChunkBase.emptyChain;
Chunk.fromString = ChunkBase.fromString;
Chunk.fromBuffer = ChunkBase.fromBuffer;
Chunk.tailRecM = ChunkBase.tailRecM;
Chunk.tailRecM_ = ChunkBase.tailRecM_;

Object.defineProperty(Chunk, 'MonoidK', {
  get(): MonoidK<ChunkF> {
    return chunkMonoidK();
  },
});
Object.defineProperty(Chunk, 'Functor', {
  get(): Functor<ChunkF> {
    return chunkFunctor();
  },
});
Object.defineProperty(Chunk, 'FunctorFilter', {
  get(): FunctorFilter<ChunkF> {
    return chunkFunctorFilter();
  },
});
Object.defineProperty(Chunk, 'Alternative', {
  get(): Alternative<ChunkF> {
    return chunkAlternative();
  },
});
Object.defineProperty(Chunk, 'Monad', {
  get(): Monad<ChunkF> {
    return chunkMonad();
  },
});
Object.defineProperty(Chunk, 'Traversable', {
  get(): Traversable<ChunkF> {
    return chunkTraversable();
  },
});

// -- HKT

declare module './algebra' {
  export interface Chunk<O> extends HKT<ChunkF, [O]> {}
}

export interface ChunkF extends TyK<[unknown]> {
  [$type]: Chunk<TyVar<this, 0>>;
}
