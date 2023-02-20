// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Option } from '../data';

export type Cons<A> = { tag: 0 } | { tag: 1; head: A; tail: Cons<A> };

export function singleton<A>(head: A): Cons<A> {
  return { tag: 1, head, tail: { tag: 0 } };
}
export function singletonFilter<A>(head: Option<A>): Cons<A> {
  return head.nonEmpty
    ? { tag: 1, head: head.get, tail: { tag: 0 } }
    : { tag: 0 };
}
export function cons<A>(head: A, tail: Cons<A>): Cons<A> {
  return { tag: 1, head, tail };
}
export function consFilter<A>(head: Option<A>, tail: Cons<A>): Cons<A> {
  return head.nonEmpty ? { tag: 1, head: head.get, tail } : tail;
}
export function consCopyToArray<A>(xs: Cons<A>, ys: A[]): A[] {
  while (xs.tag !== 0) {
    ys.push(xs.head);
    xs = xs.tail;
  }
  return ys;
}

export type Concat<A> =
  | { tag: 0 }
  | { tag: 1; value: Cons<A> }
  | { tag: 2; lhs: Concat<A>; rhs: Concat<A> };

export function single<A>(value: Cons<A>): Concat<A> {
  return { tag: 1, value };
}

export function concat<A>(lhs: Concat<A>, rhs: Concat<A>): Concat<A> {
  return { tag: 2, lhs, rhs };
}

export function concatCopyToArray<A>(xs: Concat<A>, ys: A[]): A[] {
  switch (xs.tag) {
    case 0:
      return ys;
    case 1:
      consCopyToArray(xs.value, ys);
      return ys;
    case 2:
      concatCopyToArray(xs.lhs, ys);
      concatCopyToArray(xs.rhs, ys);
      return ys;
  }
}
