import { List, Vector } from '@cats4ts/cats-core/lib/data';
import {
  ArrayChunk,
  Chunk,
  EmptyChunk,
  Queue,
  SingletonChunk,
} from './algebra';

export const empty: Chunk<never> = EmptyChunk;

export const singleton = <O>(o: O): Chunk<O> => new SingletonChunk(o);

export const fromArray = <O>(os: O[]): Chunk<O> =>
  os.length === 0 ? empty : new ArrayChunk(os);

export const fromList = <O>(os: List<O>): Chunk<O> => fromArray(os.toArray);

export const emptyQueue: Chunk<never> = new Queue(Vector.empty, 0);
