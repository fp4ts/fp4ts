// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

export interface Lazy<A> {
  (): A;
}

export const lazyVal = <A>(init: Lazy<A>): Lazy<A> => {
  let value: A | undefined;
  let initialized: boolean = false;
  return () => {
    if (!initialized) {
      initialized = true;
      value = init();
      (init as any) = null; // allow for GC
    }
    return value!;
  };
};

export function cached<A, B>(f: (a: A) => B): (a: A) => B {
  const cache = new Map<A, B>();
  return function (a: A): B {
    if (cache.has(a)) {
      return cache.get(a)!;
    }
    const b = f(a);
    cache.set(a, b);
    return b;
  };
}

export const throwError = (e: Error): never => {
  throw e;
};

export const id: <A>(a: A) => A = x => x;
export const constant: <A>(a: A) => () => A = x => () => x;

export const fst: <A, B>(x: [A, B]) => A = xs => xs[0];
export const snd: <A, B>(x: [A, B]) => B = xs => xs[1];

export const tupled = <A extends unknown[]>(...args: A): A => args;

export const flip: <A, B, C>(f: (a: A, b: B) => C) => (b: B, a: A) => C =
  f => (b, a) =>
    f(a, b);

export const curry: <A, B, C>(f: (a: A, b: B) => C) => (a: A) => (b: B) => C =
  f => x => y =>
    f(x, y);
export const uncurry: <A, B, C>(
  f: (a: A) => (b: B) => C,
) => (a: A, b: B) => C = f => (x, y) => f(x)(y);

export const applyTo: <A>(a: A) => <B>(f: (a: A) => B) => B = a => f => f(a);

export const tuple =
  <A extends unknown[], R>(f: (...args: A) => R) =>
  (args: A): R =>
    f(...args);

export const untuple =
  <A extends unknown[], R>(f: (args: A) => R) =>
  (...args: A): R =>
    f(args);

export function absurd<A>(x: never): A {
  throw new Error('Absurd function called');
}
