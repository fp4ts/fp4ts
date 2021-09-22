import { Chunk as ChunkBase } from './algebra';
import { empty, fromArray, singleton } from './constructor';

export type Chunk<O> = ChunkBase<O>;

export const Chunk: ChunkObj = function () {};

interface ChunkObj {
  empty: Chunk<never>;
  singleton<O>(o: O): Chunk<O>;
  fromArray<O>(xs: O[]): Chunk<O>;
}

Chunk.empty = empty;
Chunk.singleton = singleton;
Chunk.fromArray = fromArray;
