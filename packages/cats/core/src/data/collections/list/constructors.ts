// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Vector } from '../vector';
import { Cons, List, Nil } from './algebra';
import { prepend_ } from './operators';

export const pure = <A>(x: A): List<A> => new Cons(x, Nil);

export const cons = <A>(x: A, xs: List<A>): List<A> => new Cons(x, xs);

export const nil: List<never> = Nil;

export const empty: List<never> = Nil;

export const of = <A = never>(...xs: A[]): List<A> => fromArray(xs);

export const fromIterator = <A>(it: Iterator<A>): List<A> => {
  let next = it.next();
  if (next.done) return empty;
  const hd: Cons<A> = new Cons(next.value, Nil);
  let cur = hd;

  next = it.next();
  while (!next.done) {
    const tmp = new Cons(next.value, Nil);
    cur._tail = tmp;
    cur = tmp;
    next = it.next();
  }
  return hd;
};

export const fromArray = <A>(xs: A[]): List<A> => {
  let results: List<A> = empty;
  let idx = xs.length;
  while (idx-- > 0) {
    results = cons(xs[idx], results);
  }
  return results;
};

export const fromVector = <A>(xs: Vector<A>): List<A> =>
  xs.foldRight(empty as List<A>, cons);

export const range = (from: number, to: number): List<number> => {
  let result: List<number> = empty;
  for (let i = to - 1; i >= from; i--) {
    result = prepend_(result, i);
  }
  return result;
};
