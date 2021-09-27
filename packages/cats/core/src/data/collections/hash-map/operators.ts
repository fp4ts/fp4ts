import { ok as assert } from 'assert';
import { AnyK, Kind, throwError } from '@cats4ts/core';
import { Eq } from '../../../eq';
import { Hashable } from '../../../hashable';
import { Show } from '../../../show';
import { Monoid } from '../../../monoid';
import { MonoidK } from '../../../monoid-k';
import { Applicative } from '../../../applicative';

import { List } from '../list';
import { Option, None, Some } from '../../option';

import { Bucket, Empty, Inner, Leaf, HashMap, toNode } from './algebra';
import { id, pipe } from '@cats4ts/core';

const SIZE = 32;
const MASK = 0b11111;

export const isEmpty: <K, V>(m: HashMap<K, V>) => boolean = m =>
  m === (Empty as HashMap<never, never>);

export const nonEmpty: <K, V>(m: HashMap<K, V>) => boolean = m =>
  m !== (Empty as HashMap<never, never>);

export const keys = <K, V>(m: HashMap<K, V>): List<K> =>
  foldLeft_(m, List.empty as List<K>, (ks, _, k) => ks.prepend(k));

export const values = <K, V>(m: HashMap<K, V>): List<V> =>
  foldLeft_(m, List.empty as List<V>, (vs, v) => vs.prepend(v));

export const size = <K, V>(m: HashMap<K, V>): number =>
  foldLeft_(m, 0, x => x + 1);

export const toList = <K, V>(m: HashMap<K, V>): List<[K, V]> =>
  foldLeft_(m, List.empty as List<[K, V]>, (xs, v, k) => xs.prepend([k, v]));

export const toArray = <K, V>(m: HashMap<K, V>): [K, V][] => toList(m).toArray;

export const count: <K, V>(
  p: (v: V, k: K) => boolean,
) => (m: HashMap<K, V>) => number = p => m => count_(m, p);

export const all: <K, V>(
  p: (v: V, k: K) => boolean,
) => (m: HashMap<K, V>) => boolean = p => m => all_(m, p);

export const any: <K, V>(
  p: (v: V, k: K) => boolean,
) => (m: HashMap<K, V>) => boolean = p => m => any_(m, p);

export const hasKey: <K2>(
  H: Hashable<K2>,
) => (k: K2) => <K extends K2, V>(map: HashMap<K, V>) => boolean =
  H => k => map =>
    hasKey_(H, map, k);

export const get: <K2>(
  H: Hashable<K2>,
) => (k: K2) => <K extends K2, V>(map: HashMap<K, V>) => V = H => k => map =>
  get_(H, map, k);

export const lookup: <K2>(
  H: Hashable<K2>,
) => (k: K2) => <K extends K2, V>(map: HashMap<K, V>) => Option<V> =
  H => k => map =>
    lookup_(H, map, k);

export const insert: <K2>(
  H: Hashable<K2>,
) => <V2>(
  k: K2,
  v: V2,
) => <K extends K2, V extends V2>(map: HashMap<K, V>) => HashMap<K2, V2> =
  H => (k, v) => map =>
    insert_(H, map, k, v);

export const insertWith: <K2>(
  H: Hashable<K2>,
) => <V2>(
  k: K2,
  v: V2,
  u: (v1: V2, v2: V2, k: K2) => V2,
) => <K extends K2, V extends V2>(map: HashMap<K, V>) => HashMap<K2, V2> =
  H => (k, v, u) => map =>
    insertWith_(H, map, k, v, u);

export const update: <K2>(
  H: Hashable<K2>,
) => <V2>(
  k: K2,
  u: (v: V2, k: K2) => V2,
) => <K extends K2, V extends V2>(m: HashMap<K, V>) => HashMap<K2, V2> =
  H => (k, u) => m =>
    update_(H, m, k, u);

export const remove: <K2>(
  H: Hashable<K2>,
) => (k: K2) => <K extends K2, V>(m: HashMap<K, V>) => HashMap<K2, V> =
  H => k => m =>
    remove_(H, m, k);

export const union: <K2>(
  H: Hashable<K2>,
) => <V2>(
  m2: HashMap<K2, V2>,
) => <K extends K2, V extends V2>(m1: HashMap<K, V>) => HashMap<K2, V2> =
  H => m2 => m1 =>
    union_(H, m1, m2);

export const unionWith: <K2>(
  E: Eq<K2>,
) => <V2>(
  m2: HashMap<K2, V2>,
  u: (v1: V2, v2: V2, k: K2) => V2,
) => <K extends K2, V extends V2>(m1: HashMap<K, V>) => HashMap<K2, V2> =
  E => (m2, u) => m1 =>
    unionWith_(E, m1, m2, u);

export const intersect: <K2>(
  E: Eq<K2>,
) => <V2>(
  m2: HashMap<K2, V2>,
) => <K extends K2, V>(m: HashMap<K, V>) => HashMap<K2, V> = E => m2 => m1 =>
  intersect_(E, m1, m2);

export const intersectWith: <K2>(
  E: Eq<K2>,
) => <V, V2, C>(
  m2: HashMap<K2, V2>,
  f: (v1: V, v2: V2, k: K2) => C,
) => <K extends K2>(m: HashMap<K, V>) => HashMap<K2, C> = E => (m2, f) => m1 =>
  intersectWith_(E, m1, m2, f);

export const difference: <K2>(
  E: Eq<K2>,
) => <V2>(
  m2: HashMap<K2, V2>,
) => <K extends K2, V1>(map: HashMap<K, V1>) => HashMap<K2, V1> =
  E => m2 => m1 =>
    difference_(E, m1, m2);

export const symmetricDifference: <K2>(
  E: Eq<K2>,
) => <V2>(
  m2: HashMap<K2, V2>,
) => <K extends K2, V extends V2>(map: HashMap<K, V>) => HashMap<K2, V2> =
  E => m2 => m1 =>
    symmetricDifference_(E, m1, m2);

export const filter: <K, V>(
  p: (v: V, k: K) => boolean,
) => (m: HashMap<K, V>) => HashMap<K, V> = p => m => filter_(m, p);

export const map: <K, V, B>(
  f: (v: V, k: K) => B,
) => (m: HashMap<K, V>) => HashMap<K, B> = p => m => map_(m, p);

export const tap: <K, V>(
  f: (v: V, k: K) => unknown,
) => (m: HashMap<K, V>) => HashMap<K, V> = f => m => tap_(m, f);

export const collect: <K, V, B>(
  f: (v: V, k: K) => Option<B>,
) => (m: HashMap<K, V>) => HashMap<K, B> = f => m => collect_(m, f);

export const flatMap: <K2>(
  E: Eq<K2>,
) => <V, B>(
  f: (v: V, k: K2) => HashMap<K2, B>,
) => <K extends K2>(m: HashMap<K, V>) => HashMap<K2, B> = E => f => m =>
  flatMap_(E, m, f);

export const flatten: <K2>(
  E: Eq<K2>,
) => <K extends K2, V>(mm: HashMap<K, HashMap<K, V>>) => HashMap<K2, V> =
  E => mm =>
    flatMap_(E, mm, id);

export const foldLeft: <K, V, B>(
  z: B,
  f: (b: B, v: V, k: K) => B,
) => (m: HashMap<K, V>) => B = (z, f) => m => foldLeft_(m, z, f);

export const foldRight: <K, V, B>(
  z: B,
  f: (v: V, b: B, k: K) => B,
) => (m: HashMap<K, V>) => B = (z, f) => m => foldRight_(m, z, f);

export const foldMap: <M>(
  M: Monoid<M>,
) => <K, V>(f: (v: V, k: K) => M) => (map: HashMap<K, V>) => M =
  M => f => map =>
    foldMap_(M)(map, f);

export const foldMapK: <F extends AnyK>(
  F: MonoidK<F>,
) => <K, V, B>(
  f: (v: V, k: K) => Kind<F, [B]>,
) => (map: HashMap<K, V>) => Kind<F, [B]> = F => f => map =>
  foldMapK_(F)(map, f);

export const traverse: <G extends AnyK>(
  G: Applicative<G>,
) => <K, V, B>(
  f: (v: V, k: K) => Kind<G, [B]>,
) => (m: HashMap<K, V>) => Kind<G, [HashMap<K, B>]> = G => f => m =>
  traverse_(G)(m, f);

export const sequence: <G extends AnyK>(
  G: Applicative<G>,
) => <K, V>(m: HashMap<K, Kind<G, [V]>>) => Kind<G, [HashMap<K, V>]> = G => m =>
  traverse_(G)(m, id);

export const show: <K2, V2>(
  SK: Show<K2>,
  SV: Show<V2>,
) => <K extends K2, V extends V2>(m: HashMap<K, V>) => string = (SK, SV) => m =>
  show_(SK, SV, m);

// -- Point-ful operators

export const hasKey_ = <K, V>(
  H: Hashable<K>,
  m: HashMap<K, V>,
  k: K,
): boolean => lookup_(H, m, k).nonEmpty;

export const count_ = <K, V>(
  m: HashMap<K, V>,
  p: (v: V, k: K) => boolean,
): number => foldLeft_(m, 0, (c, v, k) => (p(v, k) ? c + 1 : c));

export const all_ = <K, V>(
  m: HashMap<K, V>,
  p: (v: V, k: K) => boolean,
): boolean => {
  const n = toNode(m);

  switch (n.tag) {
    case 'empty':
      return true;

    case 'inner':
      for (let i = 0, len = SIZE; i < len; i++) {
        if (!all_(n.children[i], p)) return false;
      }
      return true;

    case 'leaf':
      for (let i = 0, len = n.buckets.length; i < len; i++) {
        const [, k, v] = n.buckets[i];
        if (!p(v, k)) return false;
      }
      return true;
  }
};

export const any_ = <K, V>(
  m: HashMap<K, V>,
  p: (v: V, k: K) => boolean,
): boolean => {
  const n = toNode(m);

  switch (n.tag) {
    case 'empty':
      return false;

    case 'inner':
      for (let i = 0, len = SIZE; i < len; i++) {
        if (any_(n.children[i], p)) return true;
      }
      return false;

    case 'leaf':
      for (let i = 0, len = n.buckets.length; i < len; i++) {
        const [, k, v] = n.buckets[i];
        if (p(v, k)) return true;
      }
      return false;
  }
};

export const get_ = <K, V>(H: Hashable<K>, m: HashMap<K, V>, k: K): V =>
  _lookup(H, m, k, _hash(H, k), 0).fold(
    () => throwError(new Error('Key does not exist')),
    id,
  );

export const lookup_ = <K, V>(
  H: Hashable<K>,
  m: HashMap<K, V>,
  k: K,
): Option<V> => _lookup(H, m, k, _hash(H, k), 0);

export const insert_ = <K, V>(
  H: Hashable<K>,
  m: HashMap<K, V>,
  k: K,
  v: V,
): HashMap<K, V> => insertWith_(H, m, k, v, (v1, v2) => v2);

export const insertWith_ = <K, V>(
  H: Hashable<K>,
  m: HashMap<K, V>,
  k: K,
  v: V,
  u: (v1: V, v2: V, k: K) => V,
): HashMap<K, V> => _insert(H, m, k, v, _hash(H, k), 0, u);

export const update_ = <K, V>(
  H: Hashable<K>,
  m: HashMap<K, V>,
  k: K,
  u: (v: V, k: K) => V,
): HashMap<K, V> => _update(H, m, k, _hash(H, k), 0, u);

export const remove_ = <K, V>(
  H: Hashable<K>,
  m: HashMap<K, V>,
  k: K,
): HashMap<K, V> => _remove(H, m, k, _hash(H, k), 0);

export const union_ = <K, V>(
  E: Eq<K>,
  m1: HashMap<K, V>,
  m2: HashMap<K, V>,
): HashMap<K, V> => unionWith_(E, m1, m2, v => v);

export const unionWith_ = <K, V>(
  E: Eq<K>,
  m1: HashMap<K, V>,
  m2: HashMap<K, V>,
  u: (v1: V, v2: V, k: K) => V,
): HashMap<K, V> => _union(E, m1, m2, u, 0);

export const intersect_ = <K, V, V2>(
  E: Eq<K>,
  m1: HashMap<K, V>,
  m2: HashMap<K, V2>,
): HashMap<K, V> => intersectWith_(E, m1, m2, v => v);

export const intersectWith_ = <K, V1, V2, C>(
  H: Eq<K>,
  m1: HashMap<K, V1>,
  m2: HashMap<K, V2>,
  f: (v1: V1, v2: V2, k: K) => C,
): HashMap<K, C> => _intersect(H, m1, m2, 0, f);

export const difference_ = <K, V1, V2>(
  E: Eq<K>,
  m1: HashMap<K, V1>,
  m2: HashMap<K, V2>,
): HashMap<K, V1> => _difference(E, m1, m2, 0);

export const symmetricDifference_ = <K, V>(
  E: Eq<K>,
  m1: HashMap<K, V>,
  m2: HashMap<K, V>,
): HashMap<K, V> => {
  const ld = _difference(E, m1, m2, 0);
  const rd = _difference(E, m2, m1, 0);
  return union_(E, ld, rd);
};

export const filter_ = <K, V>(
  m: HashMap<K, V>,
  p: (v: V, k: K) => boolean,
): HashMap<K, V> => {
  const n = toNode(m);
  switch (n.tag) {
    case 'empty':
      return Empty;

    case 'inner': {
      let mask = 0;
      const newChildren: HashMap<K, V>[] = new Array(SIZE);
      for (let i = 0; i < SIZE; i++) {
        newChildren[i] = filter_(n.children[i], p);
        mask |= Number(newChildren[i] !== Empty) << i;
      }
      return _mkInner(newChildren, mask);
    }

    case 'leaf': {
      const newBuckets = n.buckets.filter(([, k, v]) => p(v, k));
      return _mkLeaf(newBuckets);
    }
  }
};

export const map_ = <K, V, B>(
  m: HashMap<K, V>,
  f: (v: V, k: K) => B,
): HashMap<K, B> => {
  const n = toNode(m);
  switch (n.tag) {
    case 'empty':
      return Empty;

    case 'inner':
      return _mkInner(
        n.children.map(c => map_(c, f)),
        n.mask,
      );

    case 'leaf':
      return new Leaf(n.buckets.map(([h, k, v]) => [h, k, f(v, k)]));
  }
};

export const tap_ = <K, V>(
  m: HashMap<K, V>,
  f: (v: V, k: K) => unknown,
): HashMap<K, V> =>
  map_(m, (k, v) => {
    f(k, v);
    return k;
  });

export const collect_ = <K, V, B>(
  m: HashMap<K, V>,
  f: (v: V, k: K) => Option<B>,
): HashMap<K, B> => {
  const n = toNode(m);

  switch (n.tag) {
    case 'empty':
      return Empty;

    case 'inner': {
      let mask = 0;
      const newChildren: HashMap<K, B>[] = new Array(SIZE);
      for (let i = 0; i < SIZE; i++) {
        newChildren[i] = collect_(n.children[i], f);
        mask |= Number(newChildren[i] !== Empty) << i;
      }
      return _mkInner(newChildren, mask);
    }

    case 'leaf': {
      const newBuckets: Bucket<K, B>[] = [];
      for (let i = 0, len = n.buckets.length; i < len; i++) {
        const [h, k, v] = n.buckets[i];
        f(v, k).fold(
          () => {},
          b => newBuckets.push([h, k, b]),
        );
      }
      return _mkLeaf(newBuckets);
    }
  }
};

export const flatMap_ = <K, V, B>(
  E: Eq<K>,
  m: HashMap<K, V>,
  f: (v: V, k: K) => HashMap<K, B>,
): HashMap<K, B> =>
  foldLeft_(m, Empty as HashMap<K, B>, (m2, v, k) => union_(E, m2, f(v, k)));

export const foldLeft_ = <K, V, B>(
  m: HashMap<K, V>,
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
  m: HashMap<K, V>,
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

export const foldMap_ =
  <M>(M: Monoid<M>) =>
  <K, V>(m: HashMap<K, V>, f: (v: V, k: K) => M): M =>
    foldLeft_(m, M.empty, (r, v, k) => M.combine_(r, () => f(v, k)));

export const foldMapK_ =
  <F extends AnyK>(F: MonoidK<F>) =>
  <K, V, B>(m: HashMap<K, V>, f: (v: V, k: K) => Kind<F, [B]>): Kind<F, [B]> =>
    foldLeft_(m, F.emptyK(), (r, v, k) => F.combineK_(r, () => f(v, k)));

export const traverse_ =
  <G extends AnyK>(G: Applicative<G>) =>
  <K, V, B>(
    m: HashMap<K, V>,
    f: (v: V, k: K) => Kind<G, [B]>,
  ): Kind<G, [HashMap<K, B>]> => {
    const n = toNode(m);

    switch (n.tag) {
      case 'empty':
        return G.pure(Empty as HashMap<K, B>);

      case 'inner': {
        const appendF = (
          gbs: Kind<G, [HashMap<K, B>[]]>,
          m2: HashMap<K, V>,
        ): Kind<G, HashMap<K, B>[]> =>
          G.map2_(traverse_(G)(m2, f), gbs)((m, ms) => [...ms, m]);

        return pipe(
          n.children.reduce(appendF, G.pure([] as HashMap<K, B>[])),
          G.map(children => {
            let mask = 0;
            for (let i = 0; i < SIZE; i++) {
              mask |= Number(children[i] !== Empty) << i;
            }
            return _mkInner(children, mask) as HashMap<K, B>;
          }),
        );
      }

      case 'leaf': {
        const appendF = (
          gbs: Kind<G, [Bucket<K, B>[]]>,
          [h, k, v]: Bucket<K, V>,
        ): Kind<G, [Bucket<K, B>[]]> =>
          G.map2_(f(v, k), gbs)((b, bs) => [...bs, [h, k, b]]);

        return pipe(
          n.buckets.reduce(appendF, G.pure([] as Bucket<K, B>[])),
          G.map(buckets => new Leaf(buckets) as HashMap<K, B>),
        );
      }
    }
  };

export const show_ = <K, V>(
  SK: Show<K>,
  SV: Show<V>,
  m: HashMap<K, V>,
): string => {
  const entries = toArray(m)
    .map(([k, v]) => `${SK.show(k)} => ${SV.show(v)}`)
    .join(', ');

  return entries === '' ? '[Map entries: {}]' : `[Map entries: { ${entries} }]`;
};

// -- Private implementation

const _hash = <K>(H: Hashable<K>, k: K): number =>
  // take first, most significant 32 bits
  Buffer.from(H.hash(k)).readUIntLE(0, 4);

const _index = (h: number, d: number): number => (h >> (d * 5)) & MASK;

const _mkInner = <K, V>(
  children: HashMap<K, V>[],
  mask: number,
): HashMap<K, V> => (mask ? new Inner(children, mask) : Empty);

const _mkLeaf = <K, V>(buckets: Bucket<K, V>[]): HashMap<K, V> =>
  buckets.length ? new Leaf(buckets) : Empty;

const _lookup = <K, V>(
  E: Eq<K>,
  m: HashMap<K, V>,
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
  m: HashMap<K, V>,
  k: K,
  v: V,
  h: number,
  d: number,
  u: (v1: V, v2: V, k: K) => V,
): HashMap<K, V> => {
  const n = toNode(m);

  switch (n.tag) {
    case 'empty':
      assert(d <= 5, 'Maximum depth exceeded');
      return _mkLeaf([[h, k, v]]);

    case 'inner': {
      assert(d < 5, 'Maximum depth exceeded');
      const children = [...n.children];
      const mask = _insertChildren(E, children, n.mask, k, v, h, d, u);
      return _mkInner(children, mask);
    }

    case 'leaf':
      assert(d <= 5, 'Maximum depth exceeded');
      return d < 5
        ? _insertSplit(E, n, k, v, h, d, u)
        : _insertProbe(E, n, k, v, h, d, u);
  }
};

/** Mutable! */
const _insertChildren = <K, V>(
  E: Eq<K>,
  children: HashMap<K, V>[],
  mask: number,
  k: K,
  v: V,
  h: number,
  d: number,
  u: (v1: V, v2: V, k: K) => V,
): number => {
  assert(d < 5, 'Maximum depth exceeded');
  const index = _index(h, d);
  children[index] = _insert(E, children[index], k, v, h, d + 1, u);
  return mask | (1 << index);
};

const _insertSplit = <K, V>(
  E: Eq<K>,
  n: Leaf<K, V>,
  k: K,
  v: V,
  h: number,
  d: number,
  u: (v1: V, v2: V, k: K) => V,
): HashMap<K, V> => {
  assert(d < 5, 'Maximum depth exceeded');
  assert(n.buckets.length === 1, 'Cannot have more than one bucket');
  const children: HashMap<K, V>[] = new Array(SIZE).fill(Empty);
  let mask = 0;
  const [h2, k2, v2] = n.buckets[0];
  mask = _insertChildren(E, children, mask, k2, v2, h2, d, u);
  mask = _insertChildren(E, children, mask, k, v, h, d, u);
  return _mkInner(children, mask);
};

const _insertProbe = <K, V>(
  E: Eq<K>,
  n: Leaf<K, V>,
  k: K,
  v: V,
  h: number,
  d: number,
  u: (v1: V, v2: V, k: K) => V,
): HashMap<K, V> => {
  assert(d === 5, 'Should not probe unless in max depth');
  const newBuckets = [...n.buckets];
  for (let i = 0, len = n.buckets.length; i < len; i++) {
    if (E.equals(newBuckets[i][1], k)) {
      newBuckets[i] = [h, k, u(newBuckets[i][2], v, newBuckets[i][1])];
      return _mkLeaf(newBuckets);
    }
  }
  newBuckets.push([h, k, v]);
  return _mkLeaf(newBuckets);
};

const _update = <K, V>(
  E: Eq<K>,
  m: HashMap<K, V>,
  k: K,
  h: number,
  d: number,
  u: (v: V, k: K) => V,
): HashMap<K, V> => {
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
      return _mkInner(children, n.mask);
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
      return _mkLeaf(newBuckets);
    }
  }
};

const _remove = <K, V>(
  E: Eq<K>,
  m: HashMap<K, V>,
  k: K,
  h: number,
  d: number,
): HashMap<K, V> => {
  const n = toNode(m);

  switch (n.tag) {
    case 'empty':
      assert(d <= 5, 'Maximum depth exceeded');
      return n;

    case 'inner': {
      assert(d < 5, 'Maximum depth exceeded');
      const mask = n.mask;
      const children = [...n.children];
      const index = _index(h, d);
      children[index] = _remove(E, children[index], k, h, d + 1);
      return _mkInner(
        children,
        mask & ~(Number(children[index] === Empty) << index),
      );
    }

    case 'leaf': {
      assert(d <= 5, 'Maximum depth exceeded');
      const buckets = n.buckets.filter(([, k2]) => E.notEquals(k, k2));
      return _mkLeaf(buckets);
    }
  }
};

const _union = <K, V>(
  E: Eq<K>,
  m1: HashMap<K, V>,
  m2: HashMap<K, V>,
  u: (v1: V, v2: V, k: K) => V,
  d: number,
): HashMap<K, V> => {
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

        case 'inner': {
          assert(d < 5, 'Maximum depth exceeded');
          const newChildren: HashMap<K, V>[] = new Array(SIZE);
          let mask = 0;
          for (let i = 0; i < SIZE; i++) {
            const l = n1.children[i];
            const r = n2.children[i];
            newChildren[i] = _union(E, l, r, u, d + 1);
            mask |= Number(newChildren[i] !== Empty) << i;
          }
          return _mkInner(newChildren, mask);
        }

        case 'leaf':
          assert(d < 5, 'Maximum depth exceeded');
          return n2.buckets.reduce<HashMap<K, V>>(
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
          return n1.buckets.reduce<HashMap<K, V>>(
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
): HashMap<K, V> => {
  assert(d < 5, 'Maximum depth exceeded');
  let ret: HashMap<K, V> = Empty as HashMap<never, never>;
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
): HashMap<K, V> => {
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

  return _mkLeaf(newBuckets);
};

const _intersect = <K, V1, V2, C>(
  E: Eq<K>,
  m1: HashMap<K, V1>,
  m2: HashMap<K, V2>,
  d: number,
  f: (l: V1, r: V2, k: K) => C,
): HashMap<K, C> => {
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
          const newChildren: HashMap<K, C>[] = new Array(SIZE);
          let mask = 0;
          for (let i = 0; i < SIZE; i++) {
            const l = n1.children[i];
            const r = n2.children[i];
            newChildren[i] = _intersect(E, l, r, d + 1, f);
            mask |= Number(newChildren[i] !== Empty) << i;
          }
          return _mkInner(newChildren, mask);
        }

        case 'leaf': {
          const [h, k, v2] = n2.buckets[0];
          return _lookup(E, n1, k, h, d).fold<HashMap<K, C>>(
            () => Empty,
            v1 => _mkLeaf([[h, k, f(v1, v2, k)]]),
          );
        }
      }

    case 'leaf':
      switch (n2.tag) {
        case 'empty':
          return Empty;

        case 'inner': {
          const [h, k, v1] = n1.buckets[0];
          return _lookup(E, n2, k, h, d).fold<HashMap<K, C>>(
            () => Empty,
            v2 => _mkLeaf([[h, k, f(v1, v2, k)]]),
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
): HashMap<K, C> => {
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
): HashMap<K, C> => {
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

const _difference = <K, V1, V2>(
  E: Eq<K>,
  m1: HashMap<K, V1>,
  m2: HashMap<K, V2>,
  d: number,
): HashMap<K, V1> => {
  const n1 = toNode(m1);
  const n2 = toNode(m2);

  switch (n1.tag) {
    case 'empty':
      return Empty;

    case 'inner':
      switch (n2.tag) {
        case 'empty':
          return n1;

        case 'inner': {
          const newChildren: HashMap<K, V1>[] = new Array(SIZE);
          let mask = 0;
          for (let i = 0; i < SIZE; i++) {
            const l = n1.children[i];
            const r = n2.children[i];
            newChildren[i] = _difference(E, l, r, d + 1);
            mask |= Number(newChildren[i] !== Empty) << i;
          }
          return _mkInner(newChildren, mask);
        }

        case 'leaf': {
          assert(n2.buckets.length === 1);
          const [h, k] = n2.buckets[0];
          return _remove(E, n1, k, h, d);
        }
      }

    case 'leaf':
      switch (n2.tag) {
        case 'empty':
          return n1;

        case 'inner': {
          assert(n1.buckets.length === 1);
          const [h, k] = n1.buckets[0];
          return _lookup(E, n2, k, h, d).fold(
            () => n1 as HashMap<K, V1>,
            () => Empty,
          );
        }

        case 'leaf': {
          const contains = (k: K) =>
            Boolean(n2.buckets.find(([, k2]) => E.equals(k, k2)));
          const newBuckets = n1.buckets.filter(([, k]) => !contains(k));
          return _mkLeaf(newBuckets);
        }
      }
  }
};
