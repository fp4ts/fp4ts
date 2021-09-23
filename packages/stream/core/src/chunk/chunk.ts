import { Chunk as ChunkBase } from './algebra';
import { empty, fromArray, singleton } from './constructor';

export type Chunk<O> = ChunkBase<O>;

export const Chunk: ChunkObj = function <O>(...os: O[]): Chunk<O> {
  return fromArray(os);
};

interface ChunkObj {
  <O>(...os: O[]): Chunk<O>;
  empty: Chunk<never>;
  singleton<O>(o: O): Chunk<O>;
  fromArray<O>(xs: O[]): Chunk<O>;
}

Chunk.empty = empty;
Chunk.singleton = singleton;
Chunk.fromArray = fromArray;
