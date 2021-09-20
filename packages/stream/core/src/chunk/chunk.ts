import { Chunk as ChunkBase } from './algebra';
import { fromArray, singleton } from './constructor';

export type Chunk<O> = ChunkBase<O>;

export const Chunk: ChunkObj = function () {};

interface ChunkObj {
  singleton<O>(o: O): Chunk<O>;
  fromArray<O>(xs: O[]): Chunk<O>;
}

Chunk.singleton = singleton;
Chunk.fromArray = fromArray;
