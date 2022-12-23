// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eval, Kind, throwError, id, constant } from '@fp4ts/core';
import { Monoid, Eq, Ord, Compare } from '@fp4ts/cats-kernel';
import { MonoidK } from '../../../monoid-k';
import { Applicative } from '../../../applicative';
import { Show } from '../../../show';

import { Option, Some, None } from '../../option';
import { List } from '../list';

import { Bin, Empty, Node, Map, toNode } from './algebra';

export const isEmpty = <K, V>(m: Map<K, V>): boolean => m === Empty;
export const nonEmpty = <K, V>(m: Map<K, V>): boolean => m !== Empty;

export const head = <K, V>(m: Map<K, V>): V =>
  min(m).fold(() => throwError(new Error('Empty.head')), id);

export const headOption = <K, V>(m: Map<K, V>): Option<V> => min(m);

export const tail = <K, V>(m: Map<K, V>): Map<K, V> =>
  popMin(m).fold(
    () => Empty,
    ([, t]) => t,
  );

export const init = <K, V>(m: Map<K, V>): Map<K, V> =>
  popMax(m).fold(
    () => Empty,
    ([, t]) => t,
  );

export const last = <K, V>(m: Map<K, V>): V =>
  max(m).fold(() => throwError(new Error('Empty.last')), id);

export const lastOption = <K, V>(m: Map<K, V>): Option<V> => max(m);

export const toArray = <K, V>(m: Map<K, V>): [K, V][] => {
  const result: [K, V][] = [];
  forEach_(m, (v, k) => result.push([k, v]));
  return result;
};

export const toList = <K, V>(m: Map<K, V>): List<[K, V]> =>
  foldRightStrict_(m, List.empty as List<[K, V]>, (x, xs, k) =>
    xs.prepend([k, x]),
  );

export const min = <K, V>(m: Map<K, V>): Option<V> =>
  minWithKey(m).map(([, v]) => v);

export const minWithKey = <K, V>(m0: Map<K, V>): Option<[K, V]> => {
  const loop = (n: Node<K, V>, r: Option<[K, V]>): Option<[K, V]> =>
    n.tag === 'empty' ? r : loop(toNode(n.lhs), Some([n.key, n.value]));
  return loop(toNode(m0), None);
};

export const max = <K, V>(m: Map<K, V>): Option<V> =>
  maxWithKey(m).map(([, v]) => v);

export const maxWithKey = <K, V>(m0: Map<K, V>): Option<[K, V]> => {
  const loop = (n: Node<K, V>, r: Option<[K, V]>): Option<[K, V]> =>
    n.tag === 'empty' ? r : loop(toNode(n.rhs), Some([n.key, n.value]));
  return loop(toNode(m0), None);
};

export const popMin = <K, V>(m: Map<K, V>): Option<[V, Map<K, V>]> =>
  popMinWithKey(m).map(([[, v], m]) => [v, m]);

export const popMinWithKey = <K, V>(
  m: Map<K, V>,
): Option<[[K, V], Map<K, V>]> => {
  const n = toNode(m);
  if (n.tag === 'empty') return None;

  const { key, value, lhs, rhs } = n;
  const { k, v, m: mm } = _getMinView(key, value, lhs, rhs);
  return Some([[k, v], mm]);
};

export const popMax = <K, V>(m: Map<K, V>): Option<[V, Map<K, V>]> =>
  popMaxWithKey(m).map(([[, v], m]) => [v, m]);

export const popMaxWithKey = <K, V>(
  m: Map<K, V>,
): Option<[[K, V], Map<K, V>]> => {
  const n = toNode(m);
  if (n.tag === 'empty') return None;

  const { key, value, lhs, rhs } = n;
  const { k, v, m: mm } = _getMaxView(key, value, lhs, rhs);
  return Some([[k, v], mm]);
};

export const sequence: <G>(
  G: Applicative<G>,
) => <K, V>(m: Map<K, Kind<G, [V]>>) => Kind<G, [Map<K, V>]> = G => m =>
  traverse_(G)(m, id);

// -- Point-ful operators

export const count_ = <K, V>(
  m: Map<K, V>,
  p: (v: V, k: K) => boolean,
): number => {
  const n = toNode(m);
  if (n.tag === 'empty') return 0;

  const { key, value, lhs, rhs } = n;
  return count_(lhs, p) + (p(value, key) ? 1 : 0) + count_(rhs, p);
};

export const all_ = <K, V>(
  m: Map<K, V>,
  p: (v: V, k: K) => boolean,
): boolean => {
  const n = toNode(m);
  if (n.tag === 'empty') return true;

  const { key, value, lhs, rhs } = n;
  return all_(lhs, p) && p(value, key) && all_(rhs, p);
};

export const any_ = <K, V>(
  m: Map<K, V>,
  p: (v: V, k: K) => boolean,
): boolean => {
  const n = toNode(m);
  if (n.tag === 'empty') return false;

  const { key, value, lhs, rhs } = n;
  return any_(lhs, p) || p(value, key) || any_(rhs, p);
};

export const contains_ = <K, V>(O: Ord<K>, m: Map<K, V>, k: K): boolean =>
  lookup_(O, m, k).nonEmpty;

export const get_ = <K, V>(O: Ord<K>, m: Map<K, V>, k: K): V =>
  lookup_(O, m, k).fold(
    () => throwError(new Error('Element for key does not exist')),
    id,
  );

export const lookup_ = <K, V>(O: Ord<K>, m: Map<K, V>, k: K): Option<V> => {
  const n = m as Node<K, V>;

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
  m: Map<K, V>,
  k: K,
  v: V,
): Map<K, V> => {
  const n = toNode(m);
  if (n.tag === 'empty') return new Bin(k, v, Empty, Empty);

  const { key, value, lhs, rhs } = n;
  switch (O.compare(k, n.key)) {
    case Compare.LT: {
      const l = insert_(O, lhs, k, v);
      return l === n.lhs ? n : _balanceL(key, value, l, rhs);
    }
    case Compare.GT: {
      const r = insert_(O, rhs, k, v);
      return r === n.rhs ? n : _balanceR(key, value, lhs, r);
    }
    case Compare.EQ:
      return v === n.value ? n : new Bin(k, v, n.lhs, n.rhs);
  }
};

const insertR_ = <K, V>(O: Ord<K>, m: Map<K, V>, k: K, v: V): Map<K, V> => {
  const n = toNode(m);
  if (n.tag === 'empty') return new Bin(k, v, Empty, Empty);

  const { key, value, lhs, rhs } = n;
  switch (O.compare(k, n.key)) {
    case Compare.LT: {
      const l = insertR_(O, lhs, k, v);
      return l === n.lhs ? n : _balanceL(key, value, l, rhs);
    }
    case Compare.GT: {
      const r = insertR_(O, rhs, k, v);
      return r === n.rhs ? n : _balanceR(key, value, lhs, r);
    }
    case Compare.EQ:
      return n;
  }
};

export const insertWith_ = <K, V>(
  O: Ord<K>,
  m: Map<K, V>,
  k: K,
  v: V,
  u: (v1: V, v2: V, k: K) => V,
): Map<K, V> => {
  const n = toNode(m);
  if (n.tag === 'empty') return new Bin(k, v, Empty, Empty);

  const { key, value, lhs, rhs } = n;
  switch (O.compare(k, n.key)) {
    case Compare.LT:
      return _balanceL(key, value, insertWith_(O, lhs, k, v, u), rhs);
    case Compare.GT:
      return _balanceR(key, value, lhs, insertWith_(O, rhs, k, v, u));
    case Compare.EQ:
      return new Bin(key, u(value, v, key), lhs, rhs);
  }
};

const insertWithR_ = <K, V>(
  O: Ord<K>,
  m: Map<K, V>,
  k: K,
  v: V,
  u: (v1: V, v2: V, k: K) => V,
): Map<K, V> => {
  const n = toNode(m);
  if (n.tag === 'empty') return new Bin(k, v, Empty, Empty);

  const { key, value, lhs, rhs } = n;
  switch (O.compare(k, n.key)) {
    case Compare.LT:
      return _balanceL(key, value, insertWithR_(O, lhs, k, v, u), rhs);
    case Compare.GT:
      return _balanceR(key, value, lhs, insertWithR_(O, rhs, k, v, u));
    case Compare.EQ:
      return new Bin(key, u(v, value, key), lhs, rhs);
  }
};

export const remove_ = <K, V>(O: Ord<K>, m: Map<K, V>, k: K): Map<K, V> => {
  const n = toNode(m);
  if (n.tag === 'empty') return Empty;

  const { key, value, lhs, rhs } = n;
  switch (O.compare(k, key)) {
    case Compare.LT: {
      const l = remove_(O, lhs, k);
      return l === lhs ? n : _balanceR(key, value, l, rhs);
    }
    case Compare.GT: {
      const r = remove_(O, rhs, k);
      return r === rhs ? n : _balanceL(key, value, lhs, r);
    }
    case Compare.EQ:
      return _glue(lhs, rhs);
  }
};

export const update_ = <K, V>(
  O: Ord<K>,
  m: Map<K, V>,
  k: K,
  u: (v: V, k: K) => V,
): Map<K, V> => {
  const n = toNode(m);
  if (n.tag === 'empty') return Empty;

  const { key, value, lhs, rhs } = n;
  switch (O.compare(k, key)) {
    case Compare.LT: {
      const l = update_(O, lhs, k, u);
      return l === lhs ? n : new Bin(key, value, l, rhs);
    }
    case Compare.GT: {
      const r = update_(O, rhs, k, u);
      return r === rhs ? n : new Bin(key, value, lhs, r);
    }
    case Compare.EQ:
      return new Bin(key, u(value, key), lhs, rhs);
  }
};

export const union_ = <K, V>(
  O: Ord<K>,
  m1: Map<K, V>,
  m2: Map<K, V>,
): Map<K, V> => {
  const n1 = m1 as Node<K, V>;
  if (n1.tag === 'empty') return m2;
  const n2 = m2 as Node<K, V>;
  if (n2.tag === 'empty') return m1;

  if (n2.size === 1) return insertR_(O, n1, n2.key, n2.value);
  if (n1.size === 1) return insert_(O, n2, n1.key, n1.value);

  const [l2, r2] = split_(O, n2, n1.key);
  const l1l2 = union_(O, n1.lhs, l2);
  const r1r2 = union_(O, n1.rhs, r2);

  return l1l2 === n1.lhs && r1r2 === n1.rhs
    ? n1
    : _link(n1.key, n1.value, l1l2, r1r2);
};

export const unionWith_ = <K, V>(
  O: Ord<K>,
  m1: Map<K, V>,
  m2: Map<K, V>,
  u: (v1: V, v2: V, k: K) => V,
): Map<K, V> => {
  const n1 = m1 as Node<K, V>;
  if (n1.tag === 'empty') return m2;
  const n2 = m2 as Node<K, V>;
  if (n2.tag === 'empty') return m1;

  if (n2.size === 1) return insertWith_(O, n1, n2.key, n2.value, u);
  if (n1.size === 1) return insertWithR_(O, n2, n1.key, n1.value, u);

  const [l2, mb, r2] = splitLookup_(O, n2, n1.key);
  const l1l2 = unionWith_(O, n1.lhs, l2, u);
  const r1r2 = unionWith_(O, n1.rhs, r2, u);

  return mb.fold(
    () => _link(n1.key, n1.value, l1l2, r1r2),
    x2 => _link(n1.key, u(n1.value, x2, n1.key), l1l2, r1r2),
  );
};

export const intersect_ = <K, V1, V2>(
  O: Ord<K>,
  m1: Map<K, V1>,
  m2: Map<K, V2>,
): Map<K, V1> => {
  const n1 = m1 as Node<K, V1>;
  if (n1.tag === 'empty') return Empty;
  const n2 = m2 as Node<K, V2>;
  if (n2.tag === 'empty') return Empty;

  const [l2, mb, r2] = splitMember_(O, n2, n1.key);
  const l1l2 = intersect_(O, n1.lhs, l2);
  const r1r2 = intersect_(O, n1.rhs, r2);

  return mb
    ? l1l2 === n1.lhs && r1r2 === n1.rhs
      ? n1
      : _link(n1.key, n1.value, l1l2, r1r2)
    : _merge(l1l2, r1r2);
};

export const intersectWith_ = <K, V1, V2, C>(
  O: Ord<K>,
  m1: Map<K, V1>,
  m2: Map<K, V2>,
  u: (v1: V1, v2: V2, k: K) => C,
): Map<K, C> => {
  const n1 = m1 as Node<K, V1>;
  if (n1.tag === 'empty') return Empty;
  const n2 = m2 as Node<K, V2>;
  if (n2.tag === 'empty') return Empty;

  const [l2, mb, r2] = splitLookup_(O, n2, n1.key);
  const l1l2 = intersectWith_(O, n1.lhs, l2, u);
  const r1r2 = intersectWith_(O, n1.rhs, r2, u);

  return mb.fold(
    () => _merge(l1l2, r1r2),
    x => _link(n1.key, u(n1.value, x, n1.key), l1l2, r1r2),
  );
};

export const difference_ = <K, V, V2>(
  O: Ord<K>,
  m1: Map<K, V>,
  m2: Map<K, V2>,
): Map<K, V> => {
  const n1 = m1 as Node<K, V>;
  if (n1.tag === 'empty') return Empty;
  const n2 = m2 as Node<K, V2>;
  if (n2.tag === 'empty') return n1;

  const [l1, r1] = split_(O, n1, n2.key);
  const l1l2 = difference_(O, l1, n2.lhs);
  const r1r2 = difference_(O, r1, n2.rhs);

  return l1l2.size + r1r2.size === n1.size ? n1 : _merge(l1l2, r1r2);
};

export const symmetricDifference_ = <K, V>(
  O: Ord<K>,
  m1: Map<K, V>,
  m2: Map<K, V>,
): Map<K, V> => union_(O, difference_(O, m1, m2), difference_(O, m2, m1));

export const split_ = <K, V>(
  O: Ord<K>,
  m: Map<K, V>,
  k: K,
): [Map<K, V>, Map<K, V>] => {
  const n = m as Node<K, V>;
  if (n.tag === 'empty') return [Empty, Empty];

  const cmp = O.compare(k, n.key);
  switch (cmp) {
    case Compare.LT: {
      const [lt, gt] = split_(O, n.lhs, k);
      return [lt, _link(n.key, n.value, gt, n.rhs)];
    }
    case Compare.GT: {
      const [lt, gt] = split_(O, n.rhs, k);
      return [_link(n.key, n.value, n.lhs, lt), gt];
    }
    case Compare.EQ:
      return [n.lhs, n.rhs];
  }
};

export const splitLookup_ = <K, V>(
  O: Ord<K>,
  m: Map<K, V>,
  k: K,
): [Map<K, V>, Option<V>, Map<K, V>] => {
  const n = m as Node<K, V>;
  if (n.tag === 'empty') return [Empty, None, Empty];

  const cmp = O.compare(k, n.key);
  switch (cmp) {
    case Compare.LT: {
      const [lt, found, gt] = splitLookup_(O, n.lhs, k);
      return [lt, found, _link(n.key, n.value, gt, n.rhs)];
    }
    case Compare.GT: {
      const [lt, found, gt] = splitLookup_(O, n.rhs, k);
      return [_link(n.key, n.value, n.lhs, lt), found, gt];
    }
    case Compare.EQ:
      return [n.lhs, Some(n.value), n.rhs];
  }
};

export const splitMember_ = <K, V>(
  O: Ord<K>,
  m: Map<K, V>,
  k: K,
): [Map<K, V>, boolean, Map<K, V>] => {
  const n = m as Node<K, V>;
  if (n.tag === 'empty') return [Empty, false, Empty];

  const cmp = O.compare(k, n.key);
  switch (cmp) {
    case Compare.LT: {
      const [lt, found, gt] = splitMember_(O, n.lhs, k);
      return [lt, found, _link(n.key, n.value, gt, n.rhs)];
    }
    case Compare.GT: {
      const [lt, found, gt] = splitMember_(O, n.rhs, k);
      return [_link(n.key, n.value, n.lhs, lt), found, gt];
    }
    case Compare.EQ:
      return [n.lhs, true, n.rhs];
  }
};

export const filter_ = <K, V>(
  m: Map<K, V>,
  p: (v: V, k: K) => boolean,
): Map<K, V> => {
  const n = toNode(m);
  if (n.tag === 'empty') return Empty;

  const l = filter_(n.lhs, p);
  const r = filter_(n.rhs, p);

  return p(n.value, n.key)
    ? l === n.lhs && r === n.rhs
      ? n
      : _link(n.key, n.value, l, r)
    : _merge(l, r);
};

export const map_ = <K, V, B>(
  m: Map<K, V>,
  f: (v: V, k: K) => B,
): Map<K, B> => {
  const n = toNode(m);
  if (n.tag === 'empty') return Empty;

  const { key, value, lhs, rhs } = n;
  return new Bin(key, f(value, key), map_(lhs, f), map_(rhs, f));
};

export const tap_ = <K, V>(
  m: Map<K, V>,
  f: (v: V, k: K) => unknown,
): Map<K, V> =>
  map_(m, (v, k) => {
    f(v, k);
    return v;
  });

export const collect_ = <K, V, B>(
  m: Map<K, V>,
  f: (v: V, k: K) => Option<B>,
): Map<K, B> => {
  const n = toNode(m);
  if (n.tag === 'empty') return Empty;

  const l = collect_(n.lhs, f);
  const r = collect_(n.rhs, f);

  return f(n.value, n.key).fold(
    () => _merge(l, r),
    v => _link(n.key, v, l, r),
  );
};

export const forEach_ = <K, V>(m: Map<K, V>, f: (v: V, k: K) => void): void => {
  const n = toNode(m);
  if (n.tag === 'empty') return;

  forEach_(n.lhs, f);
  f(n.value, n.key);
  forEach_(n.rhs, f);
};

export const foldLeft_ = <K, V, B>(
  m: Map<K, V>,
  z: B,
  f: (b: B, v: V, k: K) => B,
): B => {
  const n = toNode(m);
  if (n.tag === 'empty') return z;

  const zl = foldLeft_(n.lhs, z, f);
  const zm = f(zl, n.value, n.key);
  return foldLeft_(n.rhs, zm, f);
};

export const foldLeft1_ = <K, V>(m: Map<K, V>, f: (r: V, v: V) => V): V =>
  popMin(m).fold(
    () => throwError(new Error('OrderedMap.empty.foldLeft1')),
    ([v, mm]) => foldLeft_(mm, v, f),
  );

export const foldRight_ = <K, V, B>(
  m: Map<K, V>,
  ez: Eval<B>,
  f: (v: V, eb: Eval<B>, k: K) => Eval<B>,
): Eval<B> =>
  Eval.defer(() => {
    const n = toNode(m);
    if (n.tag === 'empty') return ez;

    const zr = foldRight_(n.rhs, ez, f);
    const zm = Eval.defer(() => f(n.value, zr, n.key));
    return foldRight_(n.lhs, zm, f);
  });

export const foldRightStrict_ = <K, V, B>(
  m: Map<K, V>,
  z: B,
  f: (v: V, b: B, k: K) => B,
): B => {
  const n = toNode(m);
  if (n.tag === 'empty') return z;

  const zr = foldRightStrict_(n.rhs, z, f);
  const zm = f(n.value, zr, n.key);
  return foldRightStrict_(n.lhs, zm, f);
};

export const foldRight1_ = <K, V>(m: Map<K, V>, f: (v: V, r: V) => V): V =>
  popMax(m).fold(
    () => throwError(new Error('OrderedMap.empty.foldLeft1')),
    ([v, mm]) => foldRightStrict_(mm, v, f),
  );

export const foldMap_ =
  <M>(M: Monoid<M>) =>
  <K, V>(m: Map<K, V>, f: (v: V, k: K) => M): M =>
    foldLeft_(m, M.empty, (x, y, k) => M.combine_(x, () => f(y, k)));

export const foldMapK_ =
  <F>(F: MonoidK<F>) =>
  <K, V, B>(m: Map<K, V>, f: (v: V, k: K) => Kind<F, [B]>): Kind<F, [B]> =>
    foldRight_(m, Eval.now(F.emptyK<B>()), (v, eb, k) =>
      F.combineKEval_(f(v, k), eb),
    ).value;

export const traverse_ =
  <G>(G: Applicative<G>) =>
  <K, V, B>(
    m: Map<K, V>,
    f: (v: V, k: K) => Kind<G, [B]>,
  ): Kind<G, [Map<K, B>]> => {
    const n = toNode(m);
    if (n.tag === 'empty') return G.pure(Empty);

    const lhsF = traverse_(G)(n.lhs, f);
    const bF = f(n.value, n.key);
    const rhsF = traverse_(G)(n.rhs, f);

    return G.map3_(
      lhsF,
      bF,
      rhsF,
    )((lhs, b, rhs) => new Bin(n.key, b, lhs, rhs));
  };

export const show_ = <K, V>(SK: Show<K>, SV: Show<V>, m: Map<K, V>): string => {
  const entries = toArray(m)
    .map(([k, v]) => `${SK.show(k)} => ${SV.show(v)}`)
    .join(', ');

  return entries === '' ? '[Map entries: {}]' : `[Map entries: { ${entries} }]`;
};

export const equals_ = <K, V>(
  EK: Eq<K>,
  EV: Eq<V>,
  m1: Map<K, V>,
  m2: Map<K, V>,
): boolean => {
  if (m1.size !== m2.size) return false;
  const xs = toArray(m1);
  const ys = toArray(m2);

  for (let i = 0, len = xs.length; i < len; i++) {
    if (EK.notEquals(xs[i][0], ys[i][0]) || EV.notEquals(xs[i][1], ys[i][1]))
      return false;
  }

  return true;
};

// -- Assertions

export const isValid = <K, V = never>(O: Ord<K>, m: Map<K, V>): boolean =>
  isOrdered(O, m) && isBalanced(m) && hasValidSize(m);

export const isOrdered = <K, V>(O: Ord<K>, m: Map<K, V>): boolean => {
  const bounded = (
    sa: Map<K, V>,
    lo: (a: K) => boolean,
    hi: (a: K) => boolean,
  ): boolean => {
    const sn = sa as Node<K, V>;
    if (sn.tag === 'empty') return true;

    return (
      lo(sn.key) &&
      hi(sn.key) &&
      bounded(sn.lhs, lo, x => O.lt(x, sn.key)) &&
      bounded(sn.rhs, x => O.gt(x, sn.key), hi)
    );
  };

  return bounded(m, constant(true), constant(true));
};

export const isBalanced = <K, V>(m: Map<K, V>): boolean => {
  const sn = m as Node<K, V>;
  return sn.tag === 'empty'
    ? true
    : (sn.lhs.size + sn.rhs.size <= 1 ||
        (sn.lhs.size <= delta * sn.rhs.size &&
          sn.rhs.size <= delta * sn.rhs.size)) &&
        isBalanced(sn.lhs) &&
        isBalanced(sn.rhs);
};

export const hasValidSize = <K, V>(m: Map<K, V>): boolean => {
  const realSize = (m: Map<K, V>): number => {
    const sn = m as Node<K, V>;
    return sn.tag === 'empty' ? 0 : realSize(sn.lhs) + 1 + realSize(sn.rhs);
  };
  return m.size === realSize(m);
};

// -- Private implementation

const delta = 3;
const ratio = 2;

function _balanceL<K, V>(k: K, x: V, l: Map<K, V>, r: Map<K, V>): Map<K, V> {
  const ln = l as Node<K, V>;
  if (r.size === 0) {
    if (ln.tag === 'empty') {
      return new Bin(k, x, Empty, Empty);
    } else if (ln.size === 1) {
      return new Bin(k, x, l, Empty);
    } else if (ln.lhs.size === 0) {
      return new Bin(
        (ln.rhs as Bin<K, V>).key,
        (ln.rhs as Bin<K, V>).value,
        new Bin(ln.key, ln.value, Empty, Empty),
        new Bin(k, x, Empty, Empty),
      );
    } else if (ln.rhs.size === 0) {
      return new Bin(ln.key, ln.value, ln.lhs, new Bin(k, x, Empty, Empty));
    }

    return ln.rhs.size < ratio * ln.lhs.size
      ? new Bin(ln.key, ln.value, ln.lhs, new Bin(k, x, ln.rhs, Empty))
      : new Bin(
          (ln.rhs as Bin<K, V>).key,
          (ln.rhs as Bin<K, V>).value,
          new Bin(ln.key, ln.value, ln.lhs, (ln.rhs as Bin<K, V>).lhs),
          new Bin(k, x, (ln.rhs as Bin<K, V>).rhs, Empty),
        );
  }

  if (ln.tag === 'empty') {
    return new Bin(k, x, Empty, r);
  } else if (ln.size <= delta * r.size) {
    return new Bin(k, x, l, r);
  }

  return ln.rhs.size < ratio * ln.lhs.size
    ? new Bin(ln.key, ln.value, ln.lhs, new Bin(k, x, ln.rhs, r))
    : new Bin(
        (ln.rhs as Bin<K, V>).key,
        (ln.rhs as Bin<K, V>).value,
        new Bin(ln.key, ln.value, ln.lhs, (ln.rhs as Bin<K, V>).lhs),
        new Bin(k, x, (ln.rhs as Bin<K, V>).rhs, r),
      );
}

function _balanceR<K, V>(k: K, x: V, l: Map<K, V>, r: Map<K, V>): Map<K, V> {
  const rn = r as Node<K, V>;
  if (l.size === 0) {
    if (rn.tag === 'empty') {
      return new Bin(k, x, Empty, Empty);
    } else if (rn.size === 1) {
      return new Bin(k, x, Empty, r);
    } else if (rn.lhs.size === 0) {
      return new Bin(rn.key, rn.value, new Bin(k, x, Empty, Empty), rn.rhs);
    } else if (rn.rhs.size === 0) {
      return new Bin(
        (rn.lhs as Bin<K, V>).key,
        (rn.lhs as Bin<K, V>).value,
        new Bin(k, x, Empty, Empty),
        new Bin(rn.key, rn.value, Empty, Empty),
      );
    }

    return rn.lhs.size < ratio * rn.rhs.size
      ? new Bin(rn.key, rn.value, new Bin(k, x, Empty, rn.lhs), rn.rhs)
      : new Bin(
          (rn.lhs as Bin<K, V>).key,
          (rn.lhs as Bin<K, V>).value,
          new Bin(k, x, Empty, (rn.lhs as Bin<K, V>).lhs),
          new Bin(rn.key, rn.value, (rn.lhs as Bin<K, V>).rhs, rn.rhs),
        );
  }

  if (rn.tag === 'empty') {
    return new Bin(k, x, l, Empty);
  } else if (rn.size <= delta * l.size) {
    return new Bin(k, x, l, r);
  }

  return rn.lhs.size < ratio * rn.rhs.size
    ? new Bin(rn.key, rn.value, new Bin(k, x, l, rn.lhs), rn.rhs)
    : new Bin(
        (rn.lhs as Bin<K, V>).key,
        (rn.lhs as Bin<K, V>).value,
        new Bin(k, x, l, (rn.lhs as Bin<K, V>).lhs),
        new Bin(rn.key, rn.value, (rn.lhs as Bin<K, V>).rhs, rn.rhs),
      );
}

export const _link = <K, V>(
  k: K,
  x: V,
  l: Map<K, V>,
  r: Map<K, V>,
): Map<K, V> => {
  const ln = l as Node<K, V>;
  if (ln.tag === 'empty') return _insertMin(k, x, r);
  const rn = r as Node<K, V>;
  if (rn.tag === 'empty') return _insertMax(k, x, l);

  if (delta * ln.size < rn.size)
    return _balanceL(rn.key, rn.value, _link(k, x, ln, rn.lhs), rn.rhs);
  else if (delta * rn.size < ln.size)
    return _balanceR(ln.key, ln.value, ln.lhs, _link(k, x, ln.rhs, rn));
  else return new Bin(k, x, ln, rn);
};

export const _insertMax = <K, V>(k: K, x: V, sa: Map<K, V>): Map<K, V> => {
  const sn = sa as Node<K, V>;
  return sn.tag === 'empty'
    ? new Bin(k, x, Empty, Empty)
    : _balanceR(sn.key, sn.value, sn.lhs, _insertMax(k, x, sn.rhs));
};
const _insertMin = <K, V>(k: K, x: V, sa: Map<K, V>): Map<K, V> => {
  const sn = sa as Node<K, V>;
  return sn.tag === 'empty'
    ? new Bin(k, x, Empty, Empty)
    : _balanceL(sn.key, sn.value, _insertMin(k, x, sn.lhs), sn.rhs);
};

const _merge = <K, V>(l: Map<K, V>, r: Map<K, V>): Map<K, V> => {
  const ln = l as Node<K, V>;
  if (ln.tag === 'empty') return r;
  const rn = r as Node<K, V>;
  if (rn.tag === 'empty') return l;

  return delta * ln.size < rn.size
    ? _balanceL(rn.key, rn.value, _merge(ln, rn.lhs), rn.rhs)
    : _balanceR(ln.key, ln.value, ln.lhs, _merge(ln.rhs, rn));
};

const _glue = <K, V>(l: Map<K, V>, r: Map<K, V>): Map<K, V> => {
  const ln = l as Node<K, V>;
  if (ln.tag === 'empty') return r;
  const rn = r as Node<K, V>;
  if (rn.tag === 'empty') return l;

  if (ln.size > rn.size) {
    const { key: lk, value: lx, lhs: ll, rhs: lr } = ln;
    const { k, v, m } = _getMaxView(lk, lx, ll, lr);
    return _balanceR(k, v, m, r);
  } else {
    const { key: rk, value: rx, lhs: rl, rhs: rr } = rn;
    const { k, v, m } = _getMinView(rk, rx, rl, rr);
    return _balanceL(k, v, l, m);
  }
};

type MinView<K, V> = { k: K; v: V; m: Map<K, V> };
const _getMinView = <K, V>(
  k: K,
  v: V,
  lm: Map<K, V>,
  rm: Map<K, V>,
): MinView<K, V> => {
  const ln = toNode(lm);
  if (ln.tag === 'empty') return { k, v, m: rm };

  const { key, value, lhs, rhs } = ln;
  const view = _getMinView(key, value, lhs, rhs);
  return { ...view, m: _balanceR(k, v, view.m, rm) };
};

type MaxView<K, V> = { k: K; v: V; m: Map<K, V> };
const _getMaxView = <K, V>(
  k: K,
  v: V,
  lm: Map<K, V>,
  rm: Map<K, V>,
): MaxView<K, V> => {
  const rn = toNode(rm);
  if (rn.tag === 'empty') return { k, v, m: lm };

  const { key, value, lhs, rhs } = rn;
  const view = _getMaxView(key, value, lhs, rhs);
  return { ...view, m: _balanceL(k, v, lm, view.m) };
};
