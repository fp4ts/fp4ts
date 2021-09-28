import { Ord } from '../../../ord';

import { List } from '../list';

import { Bin, Empty, OrderedMap, toNode } from './algebra';
import { insert_ } from './operators';

export const empty: OrderedMap<never, never> = Empty;

export const singleton = <K, V>(k: K, v: V): OrderedMap<K, V> =>
  new Bin(k, v, 1, empty, empty);

export const fromArray = <K, V>(O: Ord<K>, xs: [K, V][]): OrderedMap<K, V> =>
  xs.reduce((m, [k, v]) => insert_(O, m, k, v), empty as OrderedMap<K, V>);

export const fromList = <K, V>(O: Ord<K>, xs: List<[K, V]>): OrderedMap<K, V> =>
  xs.foldLeft(empty as OrderedMap<K, V>, (m, [k, v]) => insert_(O, m, k, v));

export const fromSortedArray = <K, V>(xs0: [K, V][]): OrderedMap<K, V> => {
  const loop = (xs: [K, V][], start: number, end: number): OrderedMap<K, V> => {
    if (start >= end) {
      return Empty;
    }

    const middle = Math.floor((start + end) / 2);
    const [k, v] = xs[middle];
    const lhs = loop(xs, start, middle);
    const rhs = loop(xs, middle + 1, end);
    return new Bin(k, v, Math.max(_height(lhs), _height(rhs)) + 1, lhs, rhs);
  };

  return loop(xs0, 0, xs0.length);
};

const _height = <K, V>(m: OrderedMap<K, V>): number => {
  const n = toNode(m);
  return n.tag === 'bin' ? n.height : 0;
};
