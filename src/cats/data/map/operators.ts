import { ok as assert } from 'assert';
import { Kind } from '../../../fp/hkt';
import { Eq } from '../../eq';
import { List } from '../list';
import { Option, None, Some } from '../option';
import { Hashable } from '../../hashable';
import { Applicative } from '../../applicative';

import { Bucket, Empty, Inner, Leaf, Map, toNode } from './algebra';
import { pipe } from '../../../fp/core';

export const isEmpty: <K, V>(m: Map<K, V>) => boolean = m =>
  m === (Empty as Map<never, never>);

export const nonEmpty: <K, V>(m: Map<K, V>) => boolean = m =>
  m !== (Empty as Map<never, never>);

export const keys = <K, V>(m: Map<K, V>): List<K> =>
  foldLeft_(m, List.empty as List<K>, (ks, _, k) => ks.prepend(k));

export const values = <K, V>(m: Map<K, V>): List<V> =>
  foldLeft_(m, List.empty as List<V>, (vs, v) => vs.prepend(v));

export const size = <K, V>(m: Map<K, V>): number => foldLeft_(m, 0, x => x + 1);

export const toList = <K, V>(m: Map<K, V>): List<[K, V]> =>
  foldLeft_(m, List.empty as List<[K, V]>, (xs, v, k) => xs.prepend([k, v]));

export const toArray = <K, V>(m: Map<K, V>): [K, V][] => toList(m).toArray;

export const contains: <K2>(
  H: Hashable<K2>,
) => (k: K2) => <K extends K2, V>(map: Map<K, V>) => boolean = H => k => map =>
  contains_(H, map, k);

export const lookup: <K2>(
  H: Hashable<K2>,
) => (k: K2) => <K extends K2, V>(map: Map<K, V>) => Option<V> =
  H => k => map =>
    lookup_(H, map, k);

export const insert: <K2>(
  H: Hashable<K2>,
) => <V2>(
  k: K2,
  v: V2,
) => <K extends K2, V extends V2>(map: Map<K, V>) => Map<K2, V2> =
  H => (k, v) => map =>
    insert_(H, map, k, v);

export const insertWith: <K2>(
  H: Hashable<K2>,
) => <V2>(
  k: K2,
  v: V2,
  u: (v1: V2, v2: V2, k: K2) => V2,
) => <K extends K2, V extends V2>(map: Map<K, V>) => Map<K2, V2> =
  H => (k, v, u) => map =>
    insertWith_(H, map, k, v, u);

export const update: <K2>(
  H: Hashable<K2>,
) => <V2>(
  k: K2,
  u: (v: V2, k: K2) => V2,
) => <K extends K2, V extends V2>(m: Map<K, V>) => Map<K2, V2> =
  H => (k, u) => m =>
    update_(H, m, k, u);

export const remove: <K2>(
  H: Hashable<K2>,
) => (k: K2) => <K extends K2, V>(m: Map<K, V>) => Map<K2, V> = H => k => m =>
  remove_(H, m, k);

export const union: <K2>(
  H: Hashable<K2>,
) => <V2>(
  m2: Map<K2, V2>,
) => <K extends K2, V extends V2>(m1: Map<K, V>) => Map<K2, V2> =
  H => m2 => m1 =>
    union_(H, m1, m2);

export const unionWith: <K2>(
  H: Hashable<K2>,
) => <V2>(
  m2: Map<K2, V2>,
  u: (v1: V2, v2: V2, k: K2) => V2,
) => <K extends K2, V extends V2>(m1: Map<K, V>) => Map<K2, V2> =
  H => (m2, u) => m1 =>
    unionWith_(H, m1, m2, u);

export const foldLeft: <K, V, B>(
  z: B,
  f: (b: B, v: V, k: K) => B,
) => (m: Map<K, V>) => B = (z, f) => m => foldLeft_(m, z, f);

export const foldRight: <K, V, B>(
  z: B,
  f: (v: V, b: B, k: K) => B,
) => (m: Map<K, V>) => B = (z, f) => m => foldRight_(m, z, f);

// -- Point-ful operators

export const contains_ = <K, V>(H: Hashable<K>, m: Map<K, V>, k: K): boolean =>
  lookup_(H, m, k).nonEmpty;

export const lookup_ = <K, V>(H: Hashable<K>, m: Map<K, V>, k: K): Option<V> =>
  _lookup(H, m, k, _hash(H, k), 0);

export const insert_ = <K, V>(
  H: Hashable<K>,
  m: Map<K, V>,
  k: K,
  v: V,
): Map<K, V> => insertWith_(H, m, k, v, (v1, v2) => v2);

export const insertWith_ = <K, V>(
  H: Hashable<K>,
  m: Map<K, V>,
  k: K,
  v: V,
  u: (v1: V, v2: V, k: K) => V,
): Map<K, V> => _insert(H, m, k, v, _hash(H, k), 0, u);

export const update_ = <K, V>(
  H: Hashable<K>,
  m: Map<K, V>,
  k: K,
  u: (v: V, k: K) => V,
): Map<K, V> => _update(H, m, k, _hash(H, k), 0, u);

export const remove_ = <K, V>(H: Hashable<K>, m: Map<K, V>, k: K): Map<K, V> =>
  _remove(H, m, k, _hash(H, k), 0);

export const union_ = <K, V>(
  E: Eq<K>,
  m1: Map<K, V>,
  m2: Map<K, V>,
): Map<K, V> => unionWith_(E, m1, m2, v => v);

export const unionWith_ = <K, V>(
  E: Eq<K>,
  m1: Map<K, V>,
  m2: Map<K, V>,
  u: (v1: V, v2: V, k: K) => V,
): Map<K, V> => _union(E, m1, m2, u, 0);

export const intersect_ = <K, V>(
  E: Eq<K>,
  m1: Map<K, V>,
  m2: Map<K, V>,
): Map<K, V> => intersectWith_(E, m1, m2, v => v);

export const intersectWith_ = <K, V1, V2, C>(
  H: Eq<K>,
  m1: Map<K, V1>,
  m2: Map<K, V2>,
  f: (v1: V1, v2: V2, k: K) => C,
): Map<K, C> => _intersect(H, m1, m2, 0, f);

export const filter_ = <K, V>(
  m: Map<K, V>,
  p: (v: V, k: K) => boolean,
): Map<K, V> => {
  const n = toNode(m);
  switch (n.tag) {
    case 'empty':
      return Empty;

    case 'inner':
      return _makeInner(n.children.map(c => filter_(c, p)));

    case 'leaf': {
      const newBuckets = n.buckets.filter(([, k, v]) => p(v, k));
      return newBuckets.length ? new Leaf(newBuckets) : Empty;
    }
  }
};

export const map_ = <K, V, B>(
  m: Map<K, V>,
  f: (v: V, k: K) => B,
): Map<K, B> => {
  const n = toNode(m);
  switch (n.tag) {
    case 'empty':
      return Empty;

    case 'inner':
      return new Inner(n.children.map(c => map_(c, f)));

    case 'leaf':
      return new Leaf(n.buckets.map(([h, k, v]) => [h, k, f(v, k)]));
  }
};

export const foldLeft_ = <K, V, B>(
  m: Map<K, V>,
  z: B,
  f: (b: B, v: V, k: K) => B,
): B => {
  const n = toNode(m);
  switch (n.tag) {
    case 'empty':
      return z;

    case 'inner':
      return n.children.reduce((z2, m2) => foldLeft_(m2, z2, f), z);

    case 'leaf':
      return n.buckets.reduce((z2, [, k, v]) => f(z2, v, k), z);
  }
};

export const foldRight_ = <K, V, B>(
  m: Map<K, V>,
  z: B,
  f: (v: V, b: B, k: K) => B,
): B => {
  const n = toNode(m);
  switch (n.tag) {
    case 'empty':
      return z;

    case 'inner':
      return n.children.reduceRight((z2, m2) => foldRight_(m2, z2, f), z);

    case 'leaf':
      return n.buckets.reduceRight((z2, [, k, v]) => f(v, z2, k), z);
  }
};

export const traverse_ = <G, K, V, B>(
  G: Applicative<G>,
  m: Map<K, V>,
  f: (v: V) => Kind<G, B>,
): Kind<G, Map<K, B>> => traverseWithKey_(G, m, ([, v]) => f(v));

export const traverseWithKey_ = <G, K, V, B>(
  G: Applicative<G>,
  m: Map<K, V>,
  f: (p: [K, V]) => Kind<G, B>,
): Kind<G, Map<K, B>> => {
  const n = toNode(m);

  switch (n.tag) {
    case 'empty':
      return G.pure(Empty as Map<K, B>);

    case 'inner': {
      const appendF = (
        gbs: Kind<G, Map<K, B>[]>,
        m2: Map<K, V>,
      ): Kind<G, Map<K, B>[]> =>
        G.map2(traverseWithKey_(G, m2, f), gbs)((m, ms) => [...ms, m]);

      return pipe(
        n.children.reduce(appendF, G.pure([] as Map<K, B>[])),
        G.map(children => new Inner(children) as Map<K, B>),
      );
    }

    case 'leaf': {
      const appendF = (
        gbs: Kind<G, Bucket<K, B>[]>,
        [h, k, v]: Bucket<K, V>,
      ): Kind<G, Bucket<K, B>[]> =>
        G.map2(f([k, v]), gbs)((b, bs) => [...bs, [h, k, b]]);

      return pipe(
        n.buckets.reduce(appendF, G.pure([] as Bucket<K, B>[])),
        G.map(buckets => new Leaf(buckets) as Map<K, B>),
      );
    }
  }
};

// -- Private implementation

const _hash = <K>(H: Hashable<K>, k: K): number =>
  // take first, most significant 32 bits
  Buffer.from(H.hash(k)).readUIntLE(0, 4);

const _index = (h: number, d: number): number =>
  // ensure the number is positive
  Math.abs((h & (0b11111 << (d * 5))) >> (d * 5));

const _makeInner = <K, V>(children: Map<K, V>[]): Map<K, V> => {
  for (let i = 0, len = children.length; i < len; i++) {
    if (children[i] !== Empty) return new Inner(children);
  }
  return Empty;
};

const _lookup = <K, V>(
  E: Eq<K>,
  m: Map<K, V>,
  k: K,
  h: number,
  d: number,
): Option<V> => {
  const n = toNode(m);

  switch (n.tag) {
    case 'empty':
      assert(d <= 5, 'Maximum depths exceeded');
      return None;

    case 'inner': {
      assert(d < 5, 'Maximum depths exceeded');
      const idx = _index(h, d);
      return _lookup(E, n.children[idx], k, h, d + 1);
    }

    case 'leaf': {
      assert(d <= 5, 'Maximum depths exceeded');
      for (let i = 0; i < n.buckets.length; i++) {
        const [, k2, v] = n.buckets[i];
        if (E.equals(k, k2)) return Some(v);
      }
      return None;
    }
  }
};

const _insert = <K, V>(
  E: Eq<K>,
  m: Map<K, V>,
  k: K,
  v: V,
  h: number,
  d: number,
  u: (v1: V, v2: V, k: K) => V,
): Map<K, V> => {
  const n = toNode(m);

  switch (n.tag) {
    case 'empty':
      assert(d <= 5, 'Maximum depth exceeded');
      return new Leaf([[h, k, v]]);

    case 'inner': {
      assert(d < 5, 'Maximum depth exceeded');
      const children = [...n.children];
      const index = _index(h, d);
      children[index] = _insert(E, children[index], k, v, h, d + 1, u);
      return new Inner(children);
    }

    case 'leaf':
      assert(d <= 5, 'Maximum depth exceeded');
      return d < 5
        ? _insertSplit(E, n, k, v, h, d, u)
        : _insertProbe(E, n, k, v, h, d, u);
  }
};

const _insertSplit = <K, V>(
  E: Eq<K>,
  n: Leaf<K, V>,
  k: K,
  v: V,
  h: number,
  d: number,
  u: (v1: V, v2: V, k: K) => V,
): Map<K, V> => {
  assert(d < 5, 'Maximum depth exceeded');
  assert(n.buckets.length === 1, 'Cannot have more than one bucket');
  let ret: Map<K, V> = new Inner(new Array(32).fill(Empty));
  const [h2, k2, v2] = n.buckets[0];
  ret = _insert(E, ret, k2, v2, h2, d, u);
  ret = _insert(E, ret, k, v, h, d, u);
  return ret;
};

const _insertProbe = <K, V>(
  E: Eq<K>,
  n: Leaf<K, V>,
  k: K,
  v: V,
  h: number,
  d: number,
  u: (v1: V, v2: V, k: K) => V,
): Map<K, V> => {
  assert(d === 5, 'Should not probe unless in max depth');
  const newBuckets = [...n.buckets];
  for (let i = 0, len = n.buckets.length; i < len; i++) {
    if (E.equals(newBuckets[i][1], k)) {
      newBuckets[i] = [h, k, u(newBuckets[i][2], v, newBuckets[i][1])];
      return new Leaf(newBuckets);
    }
  }
  newBuckets.push([h, k, v]);
  return new Leaf(newBuckets);
};

const _update = <K, V>(
  E: Eq<K>,
  m: Map<K, V>,
  k: K,
  h: number,
  d: number,
  u: (v: V, k: K) => V,
): Map<K, V> => {
  const n = toNode(m);

  switch (n.tag) {
    case 'empty':
      assert(d <= 5, 'Maximum depth exceeded');
      return n;

    case 'inner': {
      assert(d < 5, 'Maximum depth exceeded');
      const children = [...n.children];
      const index = _index(h, d);
      children[index] = _update(E, children[index], k, h, d + 1, u);
      return new Inner(children);
    }

    case 'leaf': {
      assert(d <= 5, 'Maximum depth exceeded');
      const newBuckets = [...n.buckets];
      for (let i = 0, len = newBuckets.length; i < len; i++) {
        if (E.equals(newBuckets[i][1], k)) {
          newBuckets[i][2] = u(newBuckets[i][2], k);
          break;
        }
      }
      return new Leaf(newBuckets);
    }
  }
};

const _remove = <K, V>(
  E: Eq<K>,
  m: Map<K, V>,
  k: K,
  h: number,
  d: number,
): Map<K, V> => {
  const n = toNode(m);

  switch (n.tag) {
    case 'empty':
      assert(d <= 5, 'Maximum depth exceeded');
      return n;

    case 'inner': {
      assert(d < 5, 'Maximum depth exceeded');
      const children = [...n.children];
      const index = _index(h, d);
      children[index] = _remove(E, children[index], k, h, d + 1);
      return _makeInner(children);
    }

    case 'leaf': {
      assert(d <= 5, 'Maximum depth exceeded');
      const buckets = n.buckets.filter(([, k2]) => E.notEquals(k, k2));
      return buckets.length ? new Leaf(buckets) : Empty;
    }
  }
};

const _union = <K, V>(
  E: Eq<K>,
  m1: Map<K, V>,
  m2: Map<K, V>,
  u: (v1: V, v2: V, k: K) => V,
  d: number,
): Map<K, V> => {
  assert(d <= 5, 'Maximum depth exceeded');
  const n1 = toNode(m1);
  const n2 = toNode(m2);

  switch (n1.tag) {
    case 'empty':
      return n2;

    case 'inner':
      switch (n2.tag) {
        case 'empty':
          return n1;

        case 'inner':
          assert(d < 5, 'Maximum depth exceeded');
          return new Inner(
            n1.children.map((c, i) => _union(E, c, n2.children[i], u, d + 1)),
          );

        case 'leaf':
          assert(d < 5, 'Maximum depth exceeded');
          return n2.buckets.reduce<Map<K, V>>(
            (nn, [h, k, v]) => _insert(E, nn, k, v, h, d, u),
            n1,
          );
      }

    case 'leaf':
      switch (n2.tag) {
        case 'empty':
          return n1;

        case 'inner':
          assert(d < 5, 'Maximum depth exceeded');
          return n1.buckets.reduce<Map<K, V>>(
            (nn, [h, k, v]) =>
              _insert(E, nn, k, v, h, d, (v2, v1, k) => u(v1, v2, k)),
            n2,
          );

        case 'leaf':
          return d < 5
            ? _mergeSplitLeafs(E, n1, n2, u, d)
            : _mergeProbeLeafs(E, n1, n2, u, d);
      }
  }
};

const _mergeSplitLeafs = <K, V>(
  E: Eq<K>,
  n1: Leaf<K, V>,
  n2: Leaf<K, V>,
  u: (v1: V, v2: V, k: K) => V,
  d: number,
): Map<K, V> => {
  assert(d < 5, 'Maximum depth exceeded');
  let ret: Map<K, V> = Empty as Map<never, never>;
  for (let i = 0, len = n1.buckets.length; i < len; i++) {
    const [h, k, v] = n1.buckets[i];
    ret = _insert(E, ret, k, v, h, d, () => v);
  }
  for (let i = 0, len = n2.buckets.length; i < len; i++) {
    const [h, k, v] = n2.buckets[i];
    ret = _insert(E, ret, k, v, h, d, u);
  }
  return ret;
};

const _mergeProbeLeafs = <K, V>(
  E: Eq<K>,
  n1: Leaf<K, V>,
  n2: Leaf<K, V>,
  u: (v1: V, v2: V, k: K) => V,
  d: number,
): Map<K, V> => {
  assert(d === 5, 'Cannot probe unless maximum depth is reached');
  const newBuckets = [...n1.buckets];
  const indexOfKey = (k: K): number =>
    n1.buckets.findIndex(([, k2]) => E.equals(k, k2));

  for (let i = 0, len = n2.buckets.length; i < len; i++) {
    const [h, k, v] = n2.buckets[i];
    const idx = indexOfKey(k);

    if (idx < 0) {
      newBuckets.push([h, k, v]);
    } else {
      newBuckets[idx] = [h, k, u(newBuckets[idx][2], v, k)];
    }
  }

  return new Leaf(newBuckets);
};

const _intersect = <K, V1, V2, C>(
  E: Eq<K>,
  m1: Map<K, V1>,
  m2: Map<K, V2>,
  d: number,
  f: (l: V1, r: V2, k: K) => C,
): Map<K, C> => {
  assert(d <= 5, 'Maximum depth exceeded');
  const n1 = toNode(m1);
  const n2 = toNode(m2);

  switch (n1.tag) {
    case 'empty':
      return Empty;

    case 'inner':
      switch (n2.tag) {
        case 'empty':
          return Empty;

        case 'inner': {
          assert(d < 5, 'Maximum depth exceeded');
          const children = n1.children.map((c, i) =>
            _intersect(E, c, n2.children[i], d + 1, f),
          );
          return _makeInner(children);
        }

        case 'leaf': {
          const [h, k, v2] = n2.buckets[0];
          return _lookup(E, n1, k, h, d).fold<Map<K, C>>(
            () => Empty,
            v1 => new Leaf([[h, k, f(v1, v2, k)]]),
          );
        }
      }

    case 'leaf':
      switch (n2.tag) {
        case 'empty':
          return Empty;

        case 'inner': {
          const [h, k, v1] = n1.buckets[0];
          return _lookup(E, n2, k, h, d).fold<Map<K, C>>(
            () => Empty,
            v2 => new Leaf([[h, k, f(v1, v2, k)]]),
          );
        }

        case 'leaf':
          return d < 5
            ? _intersectSingletonLeaves(E, n1, n2, d, f)
            : _intersectBottomLeaves(E, n1, n2, d, f);
      }
  }
};

const _intersectSingletonLeaves = <K, V1, V2, C>(
  E: Eq<K>,
  l1: Leaf<K, V1>,
  l2: Leaf<K, V2>,
  d: number,
  f: (l: V1, r: V2, k: K) => C,
): Map<K, C> => {
  const [h, k1, v1] = l1.buckets[0];
  const [, k2, v2] = l2.buckets[0];

  return E.equals(k1, k2) ? new Leaf([[h, k1, f(v1, v2, k1)]]) : Empty;
};

const _intersectBottomLeaves = <K, V1, V2, C>(
  E: Eq<K>,
  l1: Leaf<K, V1>,
  l2: Leaf<K, V2>,
  d: number,
  f: (l: V1, r: V2, k: K) => C,
): Map<K, C> => {
  const newBuckets: Bucket<K, C>[] = [];
  const idxOf = (k: K): number =>
    l2.buckets.findIndex(([, k2]) => E.equals(k, k2));

  for (let i = 0, len = l1.buckets.length; i < len; i++) {
    const [h, k, v1] = l1.buckets[i];
    const idx = idxOf(k);
    if (idx < 0) continue;

    const [, , v2] = l2.buckets[idx];
    newBuckets.push([h, k, f(v1, v2, k)]);
  }

  return newBuckets.length === 0 ? Empty : new Leaf(newBuckets);
};
