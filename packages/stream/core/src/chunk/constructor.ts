import { ArrayChunk, Chunk, SingletonChunk } from './algebra';

export const singleton = <O>(o: O): Chunk<O> => new SingletonChunk(o);

export const fromArray = <O>(os: O[]): Chunk<O> => new ArrayChunk(os);
