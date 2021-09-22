import { ok as assert } from 'assert';
import { ArrayChunk, Chunk, EmptyChunk, SingletonChunk, view } from './algebra';

export const isEmpty = <O>(c: Chunk<O>): boolean => c === EmptyChunk;
export const nonEmpty = <O>(c: Chunk<O>): boolean => c !== EmptyChunk;

export const size = <O>(c: Chunk<O>): number => {
  const v = view(c);
  switch (v.tag) {
    case 'empty':
      return 0;
    case 'singleton':
      return 1;
    case 'array':
      return v.array.length;
  }
};

export const elem: (idx: number) => <O>(c: Chunk<O>) => O = idx => c =>
  elem_(c, idx);

export const map: <O, O2>(f: (o: O) => O2) => (c: Chunk<O>) => Chunk<O2> =
  f => c =>
    map_(c, f);

// -- Point-ful operators

export const elem_ = <O>(c: Chunk<O>, idx: number): O => {
  assert(idx < size(c), 'Chunk.elem IndexOutOfBounds');
  const v = view(c);
  switch (v.tag) {
    case 'array':
      return v.array[idx];
    case 'singleton':
      return v.value;
    default:
      assert(false, 'Empty chunk cannot be indexed');
  }
};

export const map_ = <O, O2>(c: Chunk<O>, f: (o: O) => O2): Chunk<O2> => {
  const v = view(c);
  switch (v.tag) {
    case 'empty':
      return EmptyChunk;
    case 'singleton':
      return new SingletonChunk(f(v.value));
    case 'array':
      return new ArrayChunk(v.array.map(f));
  }
};

export const foldLeft_ = <O, B>(
  c: Chunk<O>,
  init: B,
  f: (b: B, o: O) => B,
): B => {
  const v = view(c);
  switch (v.tag) {
    case 'empty':
      return init;
    case 'singleton':
      return f(init, v.value);
    case 'array':
      return v.array.reduce(f, init);
  }
};
