// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Ord } from '@fp4ts/cats-kernel';

import { List } from '../list';

import { Bin, Empty, Map } from './algebra';
import { insert_, _insertMax, _link } from './operators';

export const empty: Map<never, never> = Empty;

export const singleton = <K, V>(k: K, v: V): Map<K, V> =>
  new Bin(k, v, empty, empty);

export const fromArray =
  <K>(O: Ord<K>) =>
  <V>(xs: [K, V][]): Map<K, V> => {
    if (xs.length === 0) return Empty;
    if (xs.length === 1) return singleton(xs[0][0], xs[0][1]);

    for (let i = 0, l = xs.length - 1; i < l; i++) {
      if (O.gte(xs[i][0], xs[i + 1][0])) {
        return xs.reduce(
          (m, [k, v]) => insert_(O, m, k, v),
          empty as Map<K, V>,
        );
      }
    }
    return fromSortedArray(xs);
  };

export const fromList =
  <K>(O: Ord<K>) =>
  <V>(xs: List<[K, V]>): Map<K, V> => {
    const go = (s: number, l: Map<K, V>, xs: List<[K, V]>): Map<K, V> => {
      if (xs.isEmpty) return l;
      if (xs.size === 1) {
        const [k, v] = xs.head;
        return _insertMax(k, v, l);
      }

      const [[xk, xv], xss] = xs.uncons.get;
      if (notOrdered(xk, xss)) return fromList(l, xs);
      const [r, ys, zs] = create(s << 1, xss);
      return zs.isEmpty
        ? go(s << 1, _link(xk, xv, l, r), ys)
        : fromList(_link(xk, xv, l, r), zs);
    };

    const fromList = (t0: Map<K, V>, xs: List<[K, V]>): Map<K, V> =>
      xs.foldLeft(t0, (t, [xk, xv]) => insert_(O, t, xk, xv));

    const notOrdered = (xk: K, xs: List<[K, V]>): boolean =>
      xs.isEmpty ? false : O.gte(xk, xs.head[0]);

    const create = (
      s: number,
      xs: List<[K, V]>,
    ): [Map<K, V>, List<[K, V]>, List<[K, V]>] => {
      if (xs.isEmpty) return [Empty, List.empty, List.empty];
      const [[xk, xv], xss] = xs.uncons.get;

      if (s === 1) {
        return notOrdered(xk, xss)
          ? [new Bin(xk, xv, Empty, Empty), List.empty, xss]
          : [new Bin(xk, xv, Empty, Empty), xss, List.empty];
      } else {
        const [l, ys, zs] = create(s >> 1, xs);
        if (ys.isEmpty) return [l, ys, zs];
        if (ys.size === 1) {
          const [k, v] = ys.head;
          return [_insertMax(k, v, l), List.empty, zs];
        }

        const [[yk, yv], yss] = ys.uncons.get;
        if (notOrdered(yk, yss)) return [l, List.empty, ys];
        const [r, zs_, ws] = create(s >> 1, yss);
        return [_link(yk, yv, l, r), zs_, ws];
      }
    };

    if (xs.isEmpty) return Empty;
    if (xs.size === 1) {
      const [k, v] = xs.head;
      return singleton(k, v);
    }
    const [[k0, v0], xss0] = xs.uncons.get;
    return notOrdered(k0, xss0)
      ? fromList(singleton(k0, v0), xss0)
      : go(1, singleton(k0, v0), xss0);
  };

export const fromSortedArray = <K, V>(xs0: [K, V][]): Map<K, V> => {
  const loop = (xs: [K, V][], start: number, end: number): Map<K, V> => {
    if (start >= end) {
      return Empty;
    }

    const middle = ((start + end) / 2) | 0;
    const [k, v] = xs[middle];
    const lhs = loop(xs, start, middle);
    const rhs = loop(xs, middle + 1, end);
    return new Bin(k, v, lhs, rhs);
  };

  return loop(xs0, 0, xs0.length);
};
