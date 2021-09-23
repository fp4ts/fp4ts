import { ArrayChunk, Chunk, EmptyChunk, SingletonChunk } from './algebra';

export const empty: Chunk<never> = EmptyChunk;

export const singleton = <O>(o: O): Chunk<O> => new SingletonChunk(o);

export const fromArray = <O>(os: O[]): Chunk<O> => new ArrayChunk(os);
