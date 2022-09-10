// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Vector } from '../vector';
import { Cons, List, Nil } from './algebra';
import { prepend_ } from './operators';
import { ListBuffer } from './list-buffer';

export const pure = <A>(x: A): List<A> => new Cons(x, Nil);

export const cons = <A>(x: A, xs: List<A>): List<A> => new Cons(x, xs);

export const nil: List<never> = Nil;

export const empty: List<never> = Nil;

export const of = <A = never>(...xs: A[]): List<A> => fromArray(xs);

export const fromIterator = <A>(it: Iterator<A>): List<A> =>
  ListBuffer.fromIterator(it).toList;

export const fromArray = <A>(xs: A[]): List<A> => {
  let results: List<A> = empty;
  let idx = xs.length;
  while (idx-- > 0) {
    results = cons(xs[idx], results);
  }
  return results;
};

export const fromVector = <A>(xs: Vector<A>): List<A> =>
  xs.foldRight_(empty as List<A>, cons);

export const range = (from: number, to: number): List<number> => {
  let result: List<number> = empty;
  for (let i = to - 1; i >= from; i--) {
    result = prepend_(result, i);
  }
  return result;
};
