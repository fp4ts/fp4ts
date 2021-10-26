import { Kind, throwError, id, pipe } from '@fp4ts/core';
import { Monoid } from '../../../monoid';
import { MonoidK } from '../../../monoid-k';
import { Applicative } from '../../../applicative';
import { Show } from '../../../show';
import { Ord, Compare } from '../../../ord';
import { Eq } from '../../../eq';

import { List } from '../list';
import { Option, Some, None } from '../../option';

import { Bin, Empty, Node, OrderedMap, toNode } from './algebra';
import { fromSortedArray } from './constructors';

export const isEmpty = <K, V>(m: OrderedMap<K, V>): boolean => m === Empty;
export const nonEmpty = <K, V>(m: OrderedMap<K, V>): boolean => m !== Empty;

export const head = <K, V>(m: OrderedMap<K, V>): V =>
  min(m).fold(() => throwError(new Error('Empty.head')), id);

export const headOption = <K, V>(m: OrderedMap<K, V>): Option<V> => min(m);

export const tail = <K, V>(m: OrderedMap<K, V>): OrderedMap<K, V> =>
  popMin(m).fold(
    () => Empty,
    ([, t]) => t,
  );

export const init = <K, V>(m: OrderedMap<K, V>): OrderedMap<K, V> =>
  popMax(m).fold(
    () => Empty,
    ([, t]) => t,
  );

export const last = <K, V>(m: OrderedMap<K, V>): V =>
  max(m).fold(() => throwError(new Error('Empty.last')), id);

export const lastOption = <K, V>(m: OrderedMap<K, V>): Option<V> => max(m);

export const size = <K, V>(m: OrderedMap<K, V>): number =>
  foldLeft_(m, 0, c => c + 1);

export const toArray = <K, V>(m: OrderedMap<K, V>): [K, V][] => {
  const result: [K, V][] = [];
  forEach_(m, (v, k) => result.push([k, v]));
  return result;
};

export const toList = <K, V>(m: OrderedMap<K, V>): List<[K, V]> =>
  foldRight_(m, List.empty as List<[K, V]>, (x, xs, k) => xs.prepend([k, x]));

export const count: <K, V>(
  p: (v: V, k: K) => boolean,
) => (m: OrderedMap<K, V>) => number = p => m => count_(m, p);

export const all: <K, V>(
  p: (v: V, k: K) => boolean,
) => (m: OrderedMap<K, V>) => boolean = p => m => all_(m, p);

export const any: <K, V>(
  p: (v: V, k: K) => boolean,
) => (m: OrderedMap<K, V>) => boolean = p => m => any_(m, p);

export const min = <K, V>(m: OrderedMap<K, V>): Option<V> =>
  minWithKey(m).map(([, v]) => v);

export const minWithKey = <K, V>(m0: OrderedMap<K, V>): Option<[K, V]> => {
  const loop = (n: Node<K, V>, r: Option<[K, V]>): Option<[K, V]> =>
    n.tag === 'empty' ? r : loop(toNode(n.lhs), Some([n.key, n.value]));
  return loop(toNode(m0), None);
};

export const max = <K, V>(m: OrderedMap<K, V>): Option<V> =>
  maxWithKey(m).map(([, v]) => v);

export const maxWithKey = <K, V>(m0: OrderedMap<K, V>): Option<[K, V]> => {
  const loop = (n: Node<K, V>, r: Option<[K, V]>): Option<[K, V]> =>
    n.tag === 'empty' ? r : loop(toNode(n.rhs), Some([n.key, n.value]));
  return loop(toNode(m0), None);
};

export const popMin = <K, V>(
  m: OrderedMap<K, V>,
): Option<[V, OrderedMap<K, V>]> =>
  popMinWithKey(m).map(([[, v], m]) => [v, m]);

export const popMinWithKey = <K, V>(
  m: OrderedMap<K, V>,
): Option<[[K, V], OrderedMap<K, V>]> => {
  const n = toNode(m);
  if (n.tag === 'empty') return None;

  const { key, value, lhs, rhs } = n;
  const { k, v, m: mm } = _getMinView(key, value, lhs, rhs);
  return Some([[k, v], mm]);
};

export const popMax = <K, V>(
  m: OrderedMap<K, V>,
): Option<[V, OrderedMap<K, V>]> =>
  popMaxWithKey(m).map(([[, v], m]) => [v, m]);

export const popMaxWithKey = <K, V>(
  m: OrderedMap<K, V>,
): Option<[[K, V], OrderedMap<K, V>]> => {
  const n = toNode(m);
  if (n.tag === 'empty') return None;

  const { key, value, lhs, rhs } = n;
  const { k, v, m: mm } = _getMaxView(key, value, lhs, rhs);
  return Some([[k, v], mm]);
};

export const contains: <K2>(
  O: Ord<K2>,
) => (k: K2) => <K extends K2, V>(m: OrderedMap<K, V>) => boolean =
  O => k => m =>
    contains_(O, m, k);

export const get: <K2>(
  O: Ord<K2>,
) => (k: K2) => <K extends K2, V>(m: OrderedMap<K, V>) => V = O => k => m =>
  get_(O, m, k);

export const lookup: <K2>(
  O: Ord<K2>,
) => (k: K2) => <K extends K2, V>(m: OrderedMap<K, V>) => Option<V> =
  O => k => m =>
    lookup_(O, m, k);

export const insert: <K2>(
  O: Ord<K2>,
) => <V2>(
  k: K2,
  v: V2,
) => <K extends K2, V extends V2>(m: OrderedMap<K, V>) => OrderedMap<K2, V2> =
  O => (k, v) => m =>
    insert_(O, m, k, v);

export const insertWith: <K2>(
  O: Ord<K2>,
) => <V2>(
  k: K2,
  v: V2,
  u: (v1: V2, v2: V2, k: K2) => V2,
) => <K extends K2, V extends V2>(m: OrderedMap<K, V>) => OrderedMap<K2, V2> =
  O => (k, v, u) => m =>
    insertWith_(O, m, k, v, u);

export const remove: <K2>(
  O: Ord<K2>,
) => (k: K2) => <K extends K2, V>(m: OrderedMap<K, V>) => OrderedMap<K2, V> =
  O => k => m =>
    remove_(O, m, k);

export const update: <K2>(
  O: Ord<K2>,
) => <V2>(
  k: K2,
  u: (v: V2, k: K2) => V2,
) => <K extends K2, V extends V2>(m: OrderedMap<K, V>) => OrderedMap<K2, V2> =
  O => (k, u) => m =>
    update_(O, m, k, u);

export const union: <K2>(
  O: Ord<K2>,
) => <V2>(
  m2: OrderedMap<K2, V2>,
) => <K extends K2, V extends V2>(m1: OrderedMap<K, V>) => OrderedMap<K2, V2> =
  O => m2 => m1 =>
    union_(O, m1, m2);

export const unionWith: <K2>(
  O: Ord<K2>,
) => <V2>(
  m2: OrderedMap<K2, V2>,
  u: (v1: V2, v2: V2, k: K2) => V2,
) => <K extends K2, V extends V2>(m1: OrderedMap<K, V>) => OrderedMap<K2, V2> =
  O => (m2, u) => m1 =>
    unionWith_(O, m1, m2, u);

export const intersect: <K2>(
  O: Ord<K2>,
) => <V2>(
  m2: OrderedMap<K2, V2>,
) => <K extends K2, V extends V2>(m1: OrderedMap<K, V>) => OrderedMap<K2, V2> =
  O => m2 => m1 =>
    intersect_(O, m1, m2);

export const intersectWith: <K2>(
  O: Ord<K2>,
) => <V2, C>(
  m2: OrderedMap<K2, V2>,
  u: (v1: V2, v2: V2, k: K2) => C,
) => <K extends K2, V extends V2>(m1: OrderedMap<K, V>) => OrderedMap<K2, C> =
  O => (m2, u) => m1 =>
    intersectWith_(O, m1, m2, u);

export const difference: <K2>(
  O: Ord<K2>,
) => <V2>(
  m2: OrderedMap<K2, V2>,
) => <K extends K2, V>(m1: OrderedMap<K, V>) => OrderedMap<K2, V> =
  O => m2 => m1 =>
    difference_(O, m1, m2);

export const symmetricDifference: <K2>(
  O: Ord<K2>,
) => <V2>(
  m2: OrderedMap<K2, V2>,
) => <K extends K2, V extends V2>(m1: OrderedMap<K, V>) => OrderedMap<K2, V2> =
  O => m2 => m1 =>
    symmetricDifference_(O, m1, m2);

export const filter: <K, V>(
  p: (v: V, k: K) => boolean,
) => (m: OrderedMap<K, V>) => OrderedMap<K, V> = p => m => filter_(m, p);

export const map: <K, V, B>(
  f: (v: V, k: K) => B,
) => (m: OrderedMap<K, V>) => OrderedMap<K, B> = f => m => map_(m, f);

export const tap: <K, V>(
  f: (v: V, k: K) => unknown,
) => (m: OrderedMap<K, V>) => OrderedMap<K, V> = f => m => tap_(m, f);

export const collect: <K, V, B>(
  f: (v: V, k: K) => Option<B>,
) => (m: OrderedMap<K, V>) => OrderedMap<K, B> = f => m => collect_(m, f);

export const forEach: <K, V>(
  f: (v: V, k: K) => void,
) => (m: OrderedMap<K, V>) => void = f => m => forEach_(m, f);

export const foldLeft: <K, V, B>(
  z: B,
  f: (b: B, v: V, k: K) => B,
) => (m: OrderedMap<K, V>) => B = (z, f) => m => foldLeft_(m, z, f);

export const foldLeft1: <V2>(
  f: (v: V2, r: V2) => V2,
) => <K, V extends V2>(m: OrderedMap<K, V>) => V2 = f => m => foldLeft1_(m, f);

export const foldRight: <K, V, B>(
  z: B,
  f: (v: V, b: B, k: K) => B,
) => (m: OrderedMap<K, V>) => B = (z, f) => m => foldRight_(m, z, f);

export const foldRight1: <V2>(
  f: (r: V2, v: V2) => V2,
) => <K, V extends V2>(m: OrderedMap<K, V>) => V2 = f => m => foldRight1_(m, f);

export const foldMap: <M>(
  M: Monoid<M>,
) => <K, V>(f: (v: V, k: K) => M) => (m: OrderedMap<K, V>) => M = M => f => m =>
  foldMap_(M)(m, f);

export const foldMapK: <F>(
  F: MonoidK<F>,
) => <K, V, B>(
  f: (v: V, k: K) => Kind<F, [B]>,
) => (m: OrderedMap<K, V>) => Kind<F, [B]> = F => f => m => foldMapK_(F)(m, f);

export const traverse: <G>(
  G: Applicative<G>,
) => <K, V, B>(
  f: (v: V, k: K) => Kind<G, [B]>,
) => (m: OrderedMap<K, V>) => Kind<G, [OrderedMap<K, B>]> = G => f => m =>
  traverse_(G)(m, f);

export const sequence: <G>(
  G: Applicative<G>,
) => <K, V>(m: OrderedMap<K, Kind<G, [V]>>) => Kind<G, [OrderedMap<K, V>]> =
  G => m =>
    traverse_(G)(m, id);

export const show: <K2, V2>(
  SK: Show<K2>,
  SV: Show<V2>,
) => <K extends K2, V extends V2>(m: OrderedMap<K, V>) => string =
  (SK, SV) => m =>
    show_(SK, SV, m);

// -- Point-ful operators

export const count_ = <K, V>(
  m: OrderedMap<K, V>,
  p: (v: V, k: K) => boolean,
): number => {
  const n = toNode(m);
  if (n.tag === 'empty') return 0;

  const { key, value, lhs, rhs } = n;
  return count_(lhs, p) + (p(value, key) ? 1 : 0) + count_(rhs, p);
};

export const all_ = <K, V>(
  m: OrderedMap<K, V>,
  p: (v: V, k: K) => boolean,
): boolean => {
  const n = toNode(m);
  if (n.tag === 'empty') return true;

  const { key, value, lhs, rhs } = n;
  return all_(lhs, p) && p(value, key) && all_(rhs, p);
};

export const any_ = <K, V>(
  m: OrderedMap<K, V>,
  p: (v: V, k: K) => boolean,
): boolean => {
  const n = toNode(m);
  if (n.tag === 'empty') return false;

  const { key, value, lhs, rhs } = n;
  return any_(lhs, p) || p(value, key) || any_(rhs, p);
};

export const contains_ = <K, V>(
  O: Ord<K>,
  m: OrderedMap<K, V>,
  k: K,
): boolean =>
  lookup_(O, m, k).fold(
    () => false,
    () => true,
  );

export const get_ = <K, V>(O: Ord<K>, m: OrderedMap<K, V>, k: K): V =>
  lookup_(O, m, k).fold(
    () => throwError(new Error('Element for key does not exist')),
    id,
  );

export const lookup_ = <K, V>(
  O: Ord<K>,
  m: OrderedMap<K, V>,
  k: K,
): Option<V> => {
  const n = toNode(m);

  if (n.tag === 'empty') return None;

  switch (O.compare(k, n.key)) {
    case Compare.LT:
      return lookup_(O, n.lhs, k);
    case Compare.GT:
      return lookup_(O, n.rhs, k);
    case Compare.EQ:
      return Some(n.value);
  }
};

export const insert_ = <K, V>(
  O: Ord<K>,
  m: OrderedMap<K, V>,
  k: K,
  v: V,
): OrderedMap<K, V> => insertWith_(O, m, k, v, () => v);

export const insertWith_ = <K, V>(
  O: Ord<K>,
  m: OrderedMap<K, V>,
  k: K,
  v: V,
  u: (v1: V, v2: V, k: K) => V,
): OrderedMap<K, V> => {
  const n = toNode(m);
  if (n.tag === 'empty') return _mkBin(k, v, Empty, Empty);

  const { key, value, lhs, rhs } = n;
  switch (O.compare(k, n.key)) {
    case Compare.LT:
      return _balance(_mkBin(key, value, insertWith_(O, lhs, k, v, u), rhs));

    case Compare.GT:
      return _balance(_mkBin(key, value, lhs, insertWith_(O, rhs, k, v, u)));

    case Compare.EQ:
      return _mkBin(key, u(value, v, key), lhs, rhs);
  }
};

export const remove_ = <K, V>(
  O: Ord<K>,
  m: OrderedMap<K, V>,
  k: K,
): OrderedMap<K, V> => {
  const n = toNode(m);
  if (n.tag === 'empty') return Empty;

  const { key, value, lhs, rhs } = n;
  switch (O.compare(k, key)) {
    case Compare.LT:
      return _balance(_mkBin(key, value, remove_(O, lhs, k), rhs));

    case Compare.GT:
      return _balance(_mkBin(key, value, lhs, remove_(O, rhs, k)));

    case Compare.EQ: {
      if (rhs === Empty) return lhs;
      if (lhs === Empty) return rhs;

      return _balance(_link(lhs, rhs));
    }
  }
};

export const update_ = <K, V>(
  O: Ord<K>,
  m: OrderedMap<K, V>,
  k: K,
  u: (v: V, k: K) => V,
): OrderedMap<K, V> => {
  const n = toNode(m);
  if (n.tag === 'empty') return Empty;

  const { key, value, lhs, rhs } = n;
  switch (O.compare(k, key)) {
    case Compare.LT:
      return _mkBin(key, value, update_(O, lhs, k, u), rhs);
    case Compare.GT:
      return _mkBin(key, value, lhs, update_(O, rhs, k, u));
    case Compare.EQ:
      return _mkBin(key, u(value, key), lhs, rhs);
  }
};

export const union_ = <K, V>(
  O: Ord<K>,
  m1: OrderedMap<K, V>,
  m2: OrderedMap<K, V>,
): OrderedMap<K, V> => unionWith_(O, m1, m2, v1 => v1);

export const unionWith_ = <K, V>(
  O: Ord<K>,
  m1: OrderedMap<K, V>,
  m2: OrderedMap<K, V>,
  u: (v1: V, v2: V, k: K) => V,
): OrderedMap<K, V> => {
  if (m1 === Empty) return m2;
  if (m2 === Empty) return m1;

  const xs = toArray(m1);
  const ys = toArray(m2);
  const zs: [K, V][] = [];

  const xsL = xs.length;
  const ysL = ys.length;
  let xIdx = 0;
  let yIdx = 0;

  while (xIdx < xsL && yIdx < ysL) {
    switch (O.compare(xs[xIdx][0], ys[yIdx][0])) {
      case Compare.LT:
        zs.push(xs[xIdx++]);
        break;

      case Compare.GT:
        zs.push(ys[yIdx++]);
        break;

      case Compare.EQ: {
        const key = xs[xIdx][0];
        zs.push([key, u(xs[xIdx++][1], ys[yIdx++][1], key)]);
        break;
      }
    }
  }

  while (xIdx < xsL) {
    zs.push(xs[xIdx++]);
  }

  while (yIdx < ysL) {
    zs.push(ys[yIdx++]);
  }

  return fromSortedArray(zs);
};

export const intersect_ = <K, V1, V2>(
  O: Ord<K>,
  m1: OrderedMap<K, V1>,
  m2: OrderedMap<K, V2>,
): OrderedMap<K, V1> => intersectWith_(O, m1, m2, v => v);

export const intersectWith_ = <K, V1, V2, C>(
  O: Ord<K>,
  m1: OrderedMap<K, V1>,
  m2: OrderedMap<K, V2>,
  u: (v1: V1, v2: V2, k: K) => C,
): OrderedMap<K, C> => {
  if (m1 === Empty) return Empty;
  if (m2 === Empty) return Empty;

  const xs = toArray(m1);
  const ys = toArray(m2);
  const zs: [K, C][] = [];

  const xsL = xs.length;
  const ysL = ys.length;
  let xIdx = 0;
  let yIdx = 0;

  while (xIdx < xsL && yIdx < ysL) {
    switch (O.compare(xs[xIdx][0], ys[yIdx][0])) {
      case Compare.LT:
        xIdx++;
        break;

      case Compare.GT:
        yIdx++;
        break;

      case Compare.EQ: {
        const key = xs[xIdx][0];
        zs.push([key, u(xs[xIdx++][1], ys[yIdx++][1], key)]);
        break;
      }
    }
  }

  return fromSortedArray(zs);
};

export const difference_ = <K, V, V2>(
  O: Ord<K>,
  m1: OrderedMap<K, V>,
  m2: OrderedMap<K, V2>,
): OrderedMap<K, V> => {
  if (m1 === Empty) return Empty;
  if (m2 === Empty) return m1;

  const xs = toArray(m1);
  const ys = toArray(m2);
  const zs: [K, V][] = [];

  const xsL = xs.length;
  const ysL = ys.length;
  let xIdx = 0;
  let yIdx = 0;

  while (xIdx < xsL && yIdx < ysL) {
    switch (O.compare(xs[xIdx][0], ys[yIdx][0])) {
      case Compare.LT:
        zs.push(xs[xIdx++]);
        break;

      case Compare.GT:
        ys[yIdx++];
        break;

      case Compare.EQ: {
        xIdx++;
        yIdx++;
        break;
      }
    }
  }

  while (xIdx < xsL) {
    zs.push(xs[xIdx++]);
  }

  return fromSortedArray(zs);
};

export const symmetricDifference_ = <K, V>(
  O: Ord<K>,
  m1: OrderedMap<K, V>,
  m2: OrderedMap<K, V>,
): OrderedMap<K, V> => {
  if (m1 === Empty) return m2;
  if (m2 === Empty) return m1;

  const xs = toArray(m1);
  const ys = toArray(m2);
  const zs: [K, V][] = [];

  const xsL = xs.length;
  const ysL = ys.length;
  let xIdx = 0;
  let yIdx = 0;

  while (xIdx < xsL && yIdx < ysL) {
    switch (O.compare(xs[xIdx][0], ys[yIdx][0])) {
      case Compare.LT:
        zs.push(xs[xIdx++]);
        break;

      case Compare.GT:
        zs.push(ys[yIdx++]);
        break;

      case Compare.EQ: {
        xIdx++;
        yIdx++;
        break;
      }
    }
  }

  while (xIdx < xsL) {
    zs.push(xs[xIdx++]);
  }

  while (yIdx < ysL) {
    zs.push(ys[yIdx++]);
  }

  return fromSortedArray(zs);
};

export const filter_ = <K, V>(
  m: OrderedMap<K, V>,
  p: (v: V, k: K) => boolean,
): OrderedMap<K, V> => {
  const n = toNode(m);
  if (n.tag === 'empty') return Empty;

  const { key, value, lhs, rhs } = n;

  return p(value, key)
    ? _balance(_mkBin(key, value, filter_(lhs, p), filter_(rhs, p)))
    : _balance(_link(filter_(lhs, p), filter_(rhs, p)));
};

export const map_ = <K, V, B>(
  m: OrderedMap<K, V>,
  f: (v: V, k: K) => B,
): OrderedMap<K, B> => {
  const n = toNode(m);
  if (n.tag === 'empty') return Empty;

  const { key, value, lhs, rhs } = n;
  return _mkBin(key, f(value, key), map_(lhs, f), map_(rhs, f));
};

export const tap_ = <K, V>(
  m: OrderedMap<K, V>,
  f: (v: V, k: K) => unknown,
): OrderedMap<K, V> =>
  map_(m, (v, k) => {
    f(v, k);
    return v;
  });

export const collect_ = <K, V, B>(
  m: OrderedMap<K, V>,
  f: (v: V, k: K) => Option<B>,
): OrderedMap<K, B> => {
  const n = toNode(m);
  if (n.tag === 'empty') return Empty;

  return f(n.value, n.key).fold(
    () => _balance(_link(collect_(n.lhs, f), collect_(n.rhs, f))),
    v => _balance(_mkBin(n.key, v, collect_(n.lhs, f), collect_(n.rhs, f))),
  );
};

export const forEach_ = <K, V>(
  m: OrderedMap<K, V>,
  f: (v: V, k: K) => void,
): void => {
  const n = toNode(m);
  if (n.tag === 'empty') return;

  forEach_(n.lhs, f);
  f(n.value, n.key);
  forEach_(n.rhs, f);
};

export const foldLeft_ = <K, V, B>(
  m: OrderedMap<K, V>,
  z: B,
  f: (b: B, v: V, k: K) => B,
): B => {
  const n = toNode(m);
  if (n.tag === 'empty') return z;

  const zl = foldLeft_(n.lhs, z, f);
  const zm = f(zl, n.value, n.key);
  return foldLeft_(n.rhs, zm, f);
};

export const foldLeft1_ = <K, V>(
  m: OrderedMap<K, V>,
  f: (r: V, v: V) => V,
): V =>
  popMin(m).fold(
    () => {
      throw new Error('OrderedMap.empty.foldLeft1');
    },
    ([v, mm]) => foldLeft_(mm, v, f),
  );

export const foldRight_ = <K, V, B>(
  m: OrderedMap<K, V>,
  z: B,
  f: (v: V, b: B, k: K) => B,
): B => {
  const n = toNode(m);
  if (n.tag === 'empty') return z;

  const zr = foldRight_(n.rhs, z, f);
  const zm = f(n.value, zr, n.key);
  return foldRight_(n.lhs, zm, f);
};

export const foldRight1_ = <K, V>(
  m: OrderedMap<K, V>,
  f: (v: V, r: V) => V,
): V =>
  popMax(m).fold(
    () => {
      throw new Error('OrderedMap.empty.foldLeft1');
    },
    ([v, mm]) => foldRight_(mm, v, f),
  );

export const foldMap_ =
  <M>(M: Monoid<M>) =>
  <K, V>(m: OrderedMap<K, V>, f: (v: V, k: K) => M): M =>
    foldLeft_(map_(m, f), M.empty, (x, y) => M.combine_(x, () => y));

export const foldMapK_ =
  <F>(F: MonoidK<F>) =>
  <K, V, B>(
    m: OrderedMap<K, V>,
    f: (v: V, k: K) => Kind<F, [B]>,
  ): Kind<F, [B]> =>
    foldMap_(F.algebra())(m, f);

export const traverse_ =
  <G>(G: Applicative<G>) =>
  <K, V, B>(
    m: OrderedMap<K, V>,
    f: (v: V, k: K) => Kind<G, [B]>,
  ): Kind<G, [OrderedMap<K, B>]> => {
    const n = toNode(m);
    if (n.tag === 'empty') return G.pure(Empty as OrderedMap<K, B>);

    const lhsF = traverse_(G)(n.lhs, f);
    const bF = f(n.value, n.key);
    const rhsF = traverse_(G)(n.rhs, f);

    return pipe(
      G.product_(lhsF, bF),
      G.map2(
        rhsF,
        ([lhs, b], rhs) => _mkBin(n.key, b, lhs, rhs) as OrderedMap<K, B>,
      ),
    );
  };

export const show_ = <K, V>(
  SK: Show<K>,
  SV: Show<V>,
  m: OrderedMap<K, V>,
): string => {
  const entries = toArray(m)
    .map(([k, v]) => `${SK.show(k)} => ${SV.show(v)}`)
    .join(', ');

  return entries === ''
    ? '[OrderedMap entries: {}]'
    : `[OrderedMap entries: { ${entries} }]`;
};

export const equals_ = <K, V>(
  EK: Eq<K>,
  EV: Eq<V>,
  m1: OrderedMap<K, V>,
  m2: OrderedMap<K, V>,
): boolean => {
  if (size(m1) !== size(m2)) return false;
  const xs = toArray(m1);
  const ys = toArray(m2);

  for (let i = 0, len = xs.length; i < len; i++) {
    if (EK.notEquals(xs[i][0], ys[i][0]) || EV.notEquals(xs[i][1], ys[i][1]))
      return false;
  }

  return true;
};

// Private implementation

const _mkBin = <K, V>(
  k: K,
  v: V,
  lhs: OrderedMap<K, V>,
  rhs: OrderedMap<K, V>,
): Bin<K, V> =>
  new Bin(k, v, Math.max(_height(lhs), _height(rhs)) + 1, lhs, rhs);

const _height = <K, V>(m: OrderedMap<K, V>): number => {
  const n = toNode(m);
  return n.tag === 'bin' ? n.height : 0;
};

const _rotateRight = <K, V>(n: Bin<K, V>): OrderedMap<K, V> => {
  const { key, value, lhs, rhs } = n;
  const { key: lk, value: lv, lhs: lLhs, rhs: lRhs } = lhs as Bin<K, V>;
  return _mkBin(lk, lv, lLhs, _mkBin(key, value, lRhs, rhs));
};

const _rotateLeft = <K, V>(n: Bin<K, V>): OrderedMap<K, V> => {
  const { key, value, lhs, rhs } = n;
  const { key: rk, value: rv, lhs: rLhs, rhs: rRhs } = rhs as Bin<K, V>;
  return _mkBin(rk, rv, _mkBin(key, value, lhs, rLhs), rRhs);
};

const _balance = <K, V>(m: OrderedMap<K, V>): OrderedMap<K, V> => {
  const n = toNode(m);
  if (n.tag === 'empty') return n;

  const delta = _height(n.lhs) - _height(n.rhs);
  switch (delta) {
    case 1:
    case 0:
    case -1:
      return n;
    default:
      if (delta > 0) {
        const lhs = n.lhs as Bin<K, V>;
        if (_height(lhs.lhs) - _height(lhs.rhs) >= 0) {
          return _rotateRight(n);
        } else {
          const newLhs = _rotateLeft(n.lhs as Bin<K, V>);
          return _rotateRight(_mkBin(n.key, n.value, newLhs, n.rhs));
        }
      } else {
        const rhs = n.rhs as Bin<K, V>;
        if (_height(rhs.lhs) - _height(rhs.rhs) >= 0) {
          const newRhs = _rotateRight(n.rhs as Bin<K, V>);
          return _rotateLeft(_mkBin(n.key, n.value, n.lhs, newRhs));
        } else {
          return _rotateLeft(n);
        }
      }
  }
};

const _link = <K, V>(
  lm: OrderedMap<K, V>,
  rm: OrderedMap<K, V>,
): OrderedMap<K, V> => {
  const ln = toNode(lm);
  if (ln.tag === 'empty') return rm;
  const rn = toNode(rm);
  if (rn.tag === 'empty') return lm;

  if (_height(ln) > _height(rn)) {
    const { key: lk, value: lv, lhs: lLhs, rhs: lRhs } = ln;
    const { k, v, m: lm } = _getMaxView(lk, lv, lLhs, lRhs);
    return _mkBin(k, v, lm, rn);
  } else {
    const { key: rk, value: rv, lhs: rLhs, rhs: rRhs } = rn;
    const { k, v, m: rm } = _getMinView(rk, rv, rLhs, rRhs);
    return _mkBin(k, v, ln, rm);
  }
};

type MinView<K, V> = { k: K; v: V; m: OrderedMap<K, V> };
const _getMinView = <K, V>(
  k: K,
  v: V,
  lm: OrderedMap<K, V>,
  rm: OrderedMap<K, V>,
): MinView<K, V> => {
  const ln = toNode(lm);
  if (ln.tag === 'empty') return { k, v, m: rm };

  const { key, value, lhs, rhs } = ln;
  const view = _getMinView(key, value, lhs, rhs);
  return { ...view, m: _balance(_mkBin(k, v, view.m, rm)) };
};

type MaxView<K, V> = { k: K; v: V; m: OrderedMap<K, V> };
const _getMaxView = <K, V>(
  k: K,
  v: V,
  lm: OrderedMap<K, V>,
  rm: OrderedMap<K, V>,
): MaxView<K, V> => {
  const rn = toNode(rm);
  if (rn.tag === 'empty') return { k, v, m: lm };

  const { key, value, lhs, rhs } = rn;
  const view = _getMaxView(key, value, lhs, rhs);
  return { ...view, m: _balance(_mkBin(k, v, lm, view.m)) };
};
