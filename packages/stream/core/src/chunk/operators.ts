import { List, Vector } from '@cats4ts/cats-core/lib/data';
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

export const concat: <O2>(
  c2: Chunk<O2>,
) => <O extends O2>(c1: Chunk<O>) => Chunk<O2> = c2 => c1 => concat_(c1, c2);

export const map: <O, O2>(f: (o: O) => O2) => (c: Chunk<O>) => Chunk<O2> =
  f => c =>
    map_(c, f);

export const toArray: <O>(c: Chunk<O>) => O[] = c => {
  const v = view(c);
  switch (v.tag) {
    case 'empty':
      return [];
    case 'singleton':
      return [v.value];
    case 'array':
      return v.array;
  }
};

export const toList: <O>(c: Chunk<O>) => List<O> = c =>
  List.fromArray(toArray(c));

export const toVector: <O>(c: Chunk<O>) => Vector<O> = c =>
  Vector.fromArray(toArray(c));

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

export const concat_ = <O>(c1: Chunk<O>, c2: Chunk<O>): Chunk<O> => {
  const v1 = view(c1);
  const v2 = view(c2);
  switch (v1.tag) {
    case 'empty':
      return v2;
    case 'singleton':
      switch (v2.tag) {
        case 'empty':
          return v1;
        case 'singleton':
          return new ArrayChunk([v1.value, v2.value]);
        case 'array':
          return new ArrayChunk([v1.value, ...v2.array]);
      }
    case 'array':
      switch (v2.tag) {
        case 'empty':
          return v1;
        case 'singleton':
          return new ArrayChunk([...v1.array, v2.value]);
        case 'array':
          return new ArrayChunk([...v1.array, ...v2.array]);
      }
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
