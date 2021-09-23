import { List, None, Option, Some, Vector } from '@cats4ts/cats-core/lib/data';
import { pipe } from '@cats4ts/core';
import { ok as assert } from 'assert';
import {
  ArrayChunk,
  ArraySlice,
  Chunk,
  EmptyChunk,
  SingletonChunk,
  view,
} from './algebra';

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
    case 'slice':
      return v.length;
  }
};

export const lastOption: <O>(c: Chunk<O>) => Option<O> = c => {
  const v = view(c);
  switch (v.tag) {
    case 'empty':
      return None;
    case 'singleton':
      return Some(v.value);
    case 'array':
      return Some(v.array[v.array.length - 1]);
    case 'slice':
      return Some(v.values[v.offset + v.length - 1]);
  }
};

export const take: (n: number) => <O>(c: Chunk<O>) => Chunk<O> = n => c =>
  take_(c, n);

export const drop: (n: number) => <O>(c: Chunk<O>) => Chunk<O> = n => c =>
  drop_(c, n);

export const elem: (idx: number) => <O>(c: Chunk<O>) => O = idx => c =>
  elem_(c, idx);

export const slice: (
  offset: number,
  until: number,
) => <O>(c: Chunk<O>) => Chunk<O> = (offset, until) => c =>
  slice_(c, offset, until);

export const splitAt: (
  idx: number,
) => <O>(c: Chunk<O>) => [Chunk<O>, Chunk<O>] = idx => c => splitAt_(c, idx);

export const concat: <O2>(
  c2: Chunk<O2>,
) => <O extends O2>(c1: Chunk<O>) => Chunk<O2> = c2 => c1 => concat_(c1, c2);

export const map: <O, O2>(f: (o: O) => O2) => (c: Chunk<O>) => Chunk<O2> =
  f => c =>
    map_(c, f);

export const zipWith: <O1, O2, O3>(
  c2: Chunk<O2>,
  f: (o1: O1, o2: O2) => O3,
) => (c1: Chunk<O1>) => Chunk<O3> = (c2, f) => c1 => zipWith_(c1, c2, f);

export const toArray: <O>(c: Chunk<O>) => O[] = c => {
  const v = view(c);
  switch (v.tag) {
    case 'empty':
      return [];
    case 'singleton':
      return [v.value];
    case 'array':
      return v.array;
    case 'slice':
      return v.values.slice(v.offset, v.offset + v.length);
  }
};

export const toList: <O>(c: Chunk<O>) => List<O> = c =>
  List.fromArray(toArray(c));

export const toVector: <O>(c: Chunk<O>) => Vector<O> = c =>
  Vector.fromArray(toArray(c));

// -- Point-ful operators

export const take_ = <O>(c: Chunk<O>, n: number): Chunk<O> => {
  const s = size(c);
  const v = view(c);
  if (n <= 0) return EmptyChunk;
  if (n >= s) return c;

  switch (v.tag) {
    case 'empty':
    case 'singleton':
      return v;
    case 'array':
      return new ArraySlice(v.array, 0, n);

    case 'slice':
      return new ArraySlice(v.values, v.offset, n);
  }
};

export const drop_ = <O>(c: Chunk<O>, n: number): Chunk<O> => {
  const s = size(c);
  const v = view(c);
  if (n <= 0) return c;
  if (n >= s) return EmptyChunk;

  switch (v.tag) {
    case 'empty':
    case 'singleton':
      return EmptyChunk;
    case 'array':
      return new ArraySlice(v.array, n, v.array.length - n);
    case 'slice':
      return new ArraySlice(v.values, v.offset + n, v.length - n);
  }
};

export const elem_ = <O>(c: Chunk<O>, idx: number): O => {
  assert(idx < size(c), 'Chunk.elem IndexOutOfBounds');
  const v = view(c);
  switch (v.tag) {
    case 'array':
      return v.array[idx];
    case 'singleton':
      return v.value;
    case 'slice':
      return v.values[v.offset + idx];
    default:
      assert(false, 'Empty chunk cannot be indexed');
  }
};

export const slice_ = <O>(
  c: Chunk<O>,
  offset: number,
  until: number,
): Chunk<O> => pipe(c, drop(offset), take(until - offset));

export const splitAt_ = <O>(c: Chunk<O>, n: number): [Chunk<O>, Chunk<O>] => {
  if (n <= 0) return [EmptyChunk, EmptyChunk];
  if (n >= size(c)) return [c, EmptyChunk];
  const v = view(c);
  switch (v.tag) {
    case 'empty':
      return [EmptyChunk, EmptyChunk];
    case 'singleton':
      return [v, EmptyChunk];
    case 'array':
      return [
        new ArraySlice(v.array, 0, n),
        new ArraySlice(v.array, n, v.array.length - n),
      ];
    case 'slice':
      return [
        new ArraySlice(v.values, v.offset, n),
        new ArraySlice(v.values, v.offset + n, v.length - n),
      ];
  }
};

export const concat_ = <O>(c1: Chunk<O>, c2: Chunk<O>): Chunk<O> =>
  new ArrayChunk([...toArray(c1), ...toArray(c2)]);

export const map_ = <O, O2>(c: Chunk<O>, f: (o: O) => O2): Chunk<O2> => {
  const v = view(c);
  switch (v.tag) {
    case 'empty':
      return EmptyChunk;
    case 'singleton':
      return new SingletonChunk(f(v.value));
    case 'array':
      return new ArrayChunk(v.array.map(f));
    case 'slice': {
      const ret: O2[] = new Array(v.values.length);
      for (let i = 0, len = v.values.length; i < len; i++) {
        ret[i] = f(v.values[i]);
      }
      return new ArrayChunk(ret);
    }
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
    case 'slice':
      let ret: B = init;
      for (let i = 0, len = v.values.length; i < len; i++) {
        ret = f(ret, v.values[i]);
      }
      return ret;
  }
};

export const zipWith_ = <O1, O2, O3>(
  c1: Chunk<O1>,
  c2: Chunk<O2>,
  f: (o1: O1, o2: O2) => O3,
): Chunk<O3> => {
  if (c1 === EmptyChunk || c2 === EmptyChunk) return EmptyChunk;
  const v1 = view(c1);
  const v2 = view(c2);

  switch (v1.tag) {
    case 'singleton':
      return new SingletonChunk(f(v1.value, elem_(v2, 0)));
    case 'slice':
      switch (v2.tag) {
        case 'singleton':
          return new SingletonChunk(f(elem_(v1, 0), v2.value));

        case 'slice': {
          const len = Math.min(v1.length, v2.values.length);
          const ret: O3[] = new Array(len);
          for (let i = 0; i < len; i++) {
            ret[i] = f(v1.values[v1.offset + i], v2.values[v1.offset + i]);
          }
          return new ArrayChunk(ret);
        }

        case 'array': {
          const len = Math.min(v1.length, v2.array.length);
          const ret: O3[] = new Array(len);
          for (let i = 0; i < len; i++) {
            ret[i] = f(v1.values[v1.offset + i], v2.array[i]);
          }
          return new ArrayChunk(ret);
        }

        default:
          throw new Error('impossible state');
      }
    case 'array':
      switch (v2.tag) {
        case 'slice': {
          const len = Math.min(v1.array.length, v2.length);
          const ret: O3[] = new Array(len);
          for (let i = 0; i < len; i++) {
            ret[i] = f(v1.array[i], v2.values[v2.offset + i]);
          }
          return new ArrayChunk(ret);
        }

        case 'array': {
          const len = Math.min(v1.array.length, v2.array.length);
          const ret: O3[] = new Array(len);
          for (let i = 0; i < len; i++) {
            ret[i] = f(v1.array[i], v2.array[i]);
          }
          return new ArrayChunk(ret);
        }

        default:
          throw new Error('impossible state');
      }
    default:
      throw new Error('impossible state');
  }
};
