import { ok as assert } from 'assert';
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
  const c = count / 2;
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
