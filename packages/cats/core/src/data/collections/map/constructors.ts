// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Ord } from '../../../ord';

import { List } from '../list';

import { Bin, Empty, Map } from './algebra';
import { insert_ } from './operators';

export const empty: Map<never, never> = Empty;

export const singleton = <K, V>(k: K, v: V): Map<K, V> =>
  new Bin(k, v, empty, empty);

export const fromArray =
  <K>(O: Ord<K>) =>
  <V>(xs: [K, V][]): Map<K, V> =>
    xs.reduce((m, [k, v]) => insert_(O, m, k, v), empty as Map<K, V>);

export const fromList =
  <K>(O: Ord<K>) =>
  <V>(xs: List<[K, V]>): Map<K, V> =>
    xs.foldLeft(empty as Map<K, V>, (m, [k, v]) => insert_(O, m, k, v));

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
