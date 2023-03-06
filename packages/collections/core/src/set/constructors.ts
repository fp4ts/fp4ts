// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Ord } from '@fp4ts/cats';

import { List } from '../list';

import { Bin, Empty, Set } from './algebra';
import { insert_, _insertMax, _link } from './operators';

export const pure = <A>(a: A): Set<A> => new Bin(a, Empty, Empty);

export const empty: Set<never> = Empty;

export const fromArray = <A>(O: Ord<A>, xs: A[]): Set<A> => {
  if (xs.length === 0) return Empty;
  if (xs.length === 1) return pure(xs[0]);
  for (let i = 0, l = xs.length - 1; i < l; i++) {
    if (O.gte(xs[i], xs[i + 1]))
      return xs.reduce((xs, x) => insert_(O, xs, x), Empty as Set<A>);
  }
  return fromSortedArray(xs);
};

export const fromIterator = <A>(O: Ord<A>, it: Iterator<A>): Set<A> => {
  let r = Empty as Set<A>;
  for (let i = it.next(); !i.done; i = it.next()) {
    r = insert_(O, r, i.value);
  }
  return r;
};

export const fromList = <A>(O: Ord<A>, xs: List<A>): Set<A> => {
  const go = (s: number, l: Set<A>, xs: List<A>): Set<A> => {
    if (xs.isEmpty) return l;
    if (xs.size === 1) return _insertMax(xs.head, l);

    const [x, xss] = xs.uncons.get;
    if (notOrdered(x, xss)) return fromList(l, xs);
    const [r, ys, zs] = create(s << 1, xss);
    return zs.isEmpty
      ? go(s << 1, _link(x, l, r), ys)
      : fromList(_link(x, l, r), zs);
  };

  const fromList = (t0: Set<A>, xs: List<A>): Set<A> =>
    xs.foldLeft(t0, (t, x) => insert_(O, t, x));

  const notOrdered = (x: A, xs: List<A>): boolean =>
    xs.isEmpty ? false : O.gte(x, xs.head);

  const create = (s: number, xs: List<A>): [Set<A>, List<A>, List<A>] => {
    if (xs.isEmpty) return [Empty, List.empty, List.empty];
    const [x, xss] = xs.uncons.get;

    if (s === 1) {
      return notOrdered(x, xss)
        ? [new Bin(x, Empty, Empty), List.empty, xss]
        : [new Bin(x, Empty, Empty), xss, List.empty];
    } else {
      const [l, ys, zs] = create(s >> 1, xs);
      if (ys.isEmpty) return [l, ys, zs];
      if (ys.size === 1) return [_insertMax(ys.head, l), List.empty, zs];

      const [y, yss] = ys.uncons.get;
      if (notOrdered(y, yss)) return [l, List.empty, ys];
      const [r, zs_, ws] = create(s >> 1, yss);
      return [_link(y, l, r), zs_, ws];
    }
  };

  if (xs.isEmpty) return Empty;
  if (xs.size === 1) return pure(xs.head);
  const [x0, xss0] = xs.uncons.get;
  return notOrdered(x0, xss0)
    ? fromList(pure(x0), xss0)
    : go(1, pure(x0), xss0);
};

export const fromSortedArray = <A>(xs0: A[]): Set<A> => {
  const loop = (xs: A[], start: number, end: number): Set<A> => {
    if (start >= end) {
      return Empty;
    }
    const middle = ((start + end) / 2) | 0;
    const x = xs[middle];
    const lhs = loop(xs, start, middle);
    const rhs = loop(xs, middle + 1, end);
    return new Bin(x, lhs, rhs);
  };

  return loop(xs0, 0, xs0.length);
};
