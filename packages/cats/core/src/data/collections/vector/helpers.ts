// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { ok as assert } from 'assert';
import { Vector, View } from './algebra';
import { Arr1, Arr2, Arr3, Arr4, Arr5 } from './constants';

export function copyOf<T>(or: T[], len: number): T[] {
  const res: T[] = new Array(len);
  for (let i = 0; i < len; i++) {
    res[i] = or[i];
  }
  return res;
}

export function copyOrUse<T>(a: T[], start: number, end: number): T[] {
  return start == 0 && end == a.length ? a : a.slice(start, end);
}

export function copyIfDifferentSize<T>(a: T[], len: number): T[] {
  return a.length == len ? a : copyOf(a, len);
}

export function arrayCopy<T>(
  or: T[],
  s1: number,
  des: T[],
  s2: number,
  len: number,
): void {
  for (let i = 0; i < len; i++) {
    des[i + s2] = or[i + s1];
  }
}

export function vectorSliceDim(count: number, idx: number): number {
  const c = (count / 2) | 0;
  return c + 1 - Math.abs(idx - c);
}

export function* arrIterator<T, A>(n: number, a: T[]): Generator<A> {
  if (n === 1) return yield* a as any;
  else {
    for (let i = 0, l = a.length; i < l; i++) {
      yield* arrIterator(n - 1, a[i] as unknown as unknown[]);
    }
  }
}
export function* reverseArrIterator<T, A>(n: number, a: T[]): Generator<A> {
  if (n === 1) {
    for (let i = 0, l = a.length; i < l; i++) {
      yield a[l - i - 1] as any as A;
    }
  } else {
    for (let i = 0, l = a.length; i < l; i++) {
      yield* reverseArrIterator(n - 1, a[l - i - 1] as unknown as unknown[]);
    }
  }
}

export function vectorSliceCount<A>(v: Vector<A>): number {
  const vv = v as View<A>;
  switch (vv.tag) {
    case 0:
      return 0;
    case 1:
      return 1;
    case 2:
      return 3;
    case 3:
      return 5;
    case 4:
      return 7;
    case 5:
      return 9;
    case 6:
      return 11;
  }
}

export function ioob(idx: number): never {
  throw new Error(`Index out of bounds ${idx}`);
}
export function wrap1(x: unknown): Arr1 {
  return [x];
}
export function wrap2(x: Arr1): Arr2 {
  return [x];
}
export function wrap3(x: Arr2): Arr3 {
  return [x];
}
export function wrap4(x: Arr3): Arr4 {
  return [x];
}
export function wrap5(x: Arr4): Arr5 {
  return [x];
}
export function mapElems1<A, B>(xs: Arr1, f: (a: A) => B): Arr1 {
  const l = xs.length;
  const rs = new Array(l);
  for (let i = 0; i < l; i++) {
    rs[i] = f(xs[i] as unknown as A) as unknown;
  }
  return rs;
}
export function mapElems<A, B, T>(n: number, xs: T[], f: (a: A) => B): T[] {
  assert(n > 0);
  if (n === 1) {
    return mapElems1(xs, f) as T[];
  } else {
    const l = xs.length;
    const rs = new Array(l);
    for (let i = 0; i < l; i++) {
      rs[i] = mapElems(n - 1, xs[i] as unknown as unknown[], f);
    }
    return rs;
  }
}
export function foldLeft1<A, B, T>(xs: Arr1, z: B, f: (b: B, a: A) => B): B {
  for (let i = 0, l = xs.length; i < l; i++) {
    z = f(z, xs[i] as A);
  }
  return z;
}
export function foldLeft<A, B, T>(
  n: number,
  xs: T[],
  z: B,
  f: (b: B, a: A) => B,
): B {
  assert(n > 0);
  if (n === 1) {
    return foldLeft1(xs, z, f) as B;
  } else {
    for (let i = 0, l = xs.length; i < l; i++) {
      z = foldLeft(n - 1, xs[i] as unknown as unknown[], z, f);
    }
    return z;
  }
}
