// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Option } from '../data';

export type Cons<A> =
  | { tag: 0; size: number }
  | { tag: 1; head: A; tail: Cons<A>; size: number };

export function singleton<A>(head: A): Cons<A> {
  return { tag: 1, head, tail: Nil as Cons<A>, size: 1 };
}
export function singletonFilter<A>(head: Option<A>): Cons<A> {
  return head.nonEmpty ? singleton(head.get) : (Nil as Cons<A>);
}
export function cons<A>(head: A, tail: Cons<A>): Cons<A> {
  return { tag: 1, head, tail, size: tail.size + 1 };
}
export function consFilter<A>(head: Option<A>, tail: Cons<A>): Cons<A> {
  return head.nonEmpty ? cons(head.get, tail) : tail;
}
export function consToArray<A>(xs: Cons<A>): A[] {
  const ys = new Array<A>(xs.size);
  _consCopyToArray(xs, ys, 0);
  return ys;
}
const Nil: Concat<never> = { tag: 0, size: 0 };

export type Concat<A> =
  | { tag: 0; size: number }
  | { tag: 1; value: Cons<A>; size: number }
  | { tag: 2; lhs: Concat<A>; rhs: Concat<A>; size: number };

export function single<A>(value: Cons<A>): Concat<A> {
  return { tag: 1, value, size: value.size };
}

export function concat<A>(lhs: Concat<A>, rhs: Concat<A>): Concat<A> {
  if (lhs === Nil) return rhs;
  if (rhs === Nil) return lhs;
  return { tag: 2, lhs, rhs, size: lhs.size + rhs.size };
}

export function concatToArray<A>(xs: Concat<A>): A[] {
  const ys = new Array<A>(xs.size);
  _concatCopyToArray(xs, ys, 0);
  return ys;
}

function _consCopyToArray<A>(xs: Cons<A>, ys: A[], idx: number): number {
  while (xs.tag !== 0) {
    ys[idx++] = xs.head;
    xs = xs.tail;
  }
  return idx;
}

function _concatCopyToArray<A>(xs: Concat<A>, ys: A[], idx: number): number {
  switch (xs.tag) {
    case 0:
      return idx;
    case 1:
      return _consCopyToArray(xs.value, ys, idx);
    case 2:
      return _concatCopyToArray(
        xs.rhs,
        ys,
        _concatCopyToArray(xs.lhs, ys, idx),
      );
  }
}
