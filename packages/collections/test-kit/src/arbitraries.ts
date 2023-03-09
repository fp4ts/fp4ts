// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import './fast-check-extension';
import fc, { Arbitrary } from 'fast-check';
import { Hashable, Ord } from '@fp4ts/cats-kernel';
import {
  Chain,
  HashMap,
  LazyList,
  List,
  NonEmptyList,
  OrdMap,
  Seq,
  Set,
  Vector,
  View,
} from '@fp4ts/collections-core';

interface ListConstraints {
  readonly minLength?: number;
  readonly maxLength?: number;
}
export const fp4tsList = <A>(
  arbA: Arbitrary<A>,
  constraints: ListConstraints = {},
): Arbitrary<List<A>> => fc.array(arbA, constraints).map(List.fromArray);

export const fp4tsLazyList = <A>(
  arbA: Arbitrary<A>,
  constraints: ListConstraints = {},
): Arbitrary<LazyList<A>> =>
  fc.array(arbA, constraints).map(LazyList.fromArray);

export const fp4tsNel = <A>(arbA: Arbitrary<A>): Arbitrary<NonEmptyList<A>> =>
  fc.tuple(arbA, fp4tsList(arbA)).map(([hd, tl]) => NonEmptyList(hd, tl));

interface VectorConstraints {
  readonly minLength?: number;
  readonly maxLength?: number;
}
export const fp4tsVector = <A>(
  arbA: Arbitrary<A>,
  constraints: VectorConstraints = {},
): Arbitrary<Vector<A>> => {
  const arb = fc.array(arbA, constraints).map(Vector.fromArray);
  return fc.oneof(
    arb,
    arb.map(xs => xs.drop(1)),
    arb.map(xs => xs.dropRight(1)),
  );
};

export const fp4tsSeq = <A>(arbA: Arbitrary<A>): Arbitrary<Seq<A>> => {
  const arb = fc.array(arbA).map(Seq.fromArray);
  return fc.oneof(
    arb,
    fc.tuple(arb, arb).map(([x, y]) => x.concat(y)),
  );
};

export const fp4tsChain = <A>(arbA: Arbitrary<A>): Arbitrary<Chain<A>> => {
  const maxDepth = 5;

  const base = fc.oneof(
    { weight: 1, arbitrary: fc.constant(Chain.empty) },
    { weight: 5, arbitrary: arbA.map(Chain.singleton) },
    {
      weight: 20,
      arbitrary: fc.array(arbA).map(Chain.fromArray),
    },
  );

  const recursive = fc.memo((depth: number): Arbitrary<Chain<A>> => {
    if (depth >= maxDepth) return base;
    return fc
      .tuple(gen(depth + 1), gen(depth + 1))
      .map(([pfx, sfx]) => pfx['+++'](Chain.empty)['+++'](sfx));
  });

  const gen = (depth: number): Arbitrary<Chain<A>> =>
    fc.oneof(base, recursive(depth));

  return gen(0);
};

export const fp4tsOrdMap = <K, V>(
  arbK: Arbitrary<K>,
  arbV: Arbitrary<V>,
  O: Ord<K> = Ord.fromUniversalCompare(),
): Arbitrary<OrdMap<K, V>> =>
  fc.array(fc.tuple(arbK, arbV)).map(xs => OrdMap.fromArray(xs, O));

export const fp4tsSet = <A>(
  arbA: Arbitrary<A>,
  O: Ord<A> = Ord.fromUniversalCompare(),
): Arbitrary<Set<A>> => fc.array(arbA).map(xs => Set.fromArray(O, xs));

interface HashMapConstraints {
  readonly minSize?: number;
  readonly maxSize?: number;
}
export const fp4tsHashMap = <K, V>(
  arbK: Arbitrary<K>,
  arbV: Arbitrary<V>,
  H: Hashable<K>,
  constraints: HashMapConstraints = {},
): Arbitrary<HashMap<K, V>> => {
  const minSize =
    constraints.minSize != null && constraints.minSize >= 0
      ? constraints.minSize
      : 0;
  const maxSize =
    constraints.maxSize != null &&
    constraints.maxSize <= Number.MAX_SAFE_INTEGER
      ? constraints.maxSize
      : Math.min(2 * minSize + 10, 0x7fffffff);

  return fc
    .integer({ min: minSize, max: maxSize })
    .chain(size =>
      fc
        .array(fc.tuple(arbK, arbV), { minLength: size, maxLength: size })
        .map(HashMap.fromArray(H)),
    );
};

export const fp4tsView = <A>(arbA: Arbitrary<A>): Arbitrary<View<A>> =>
  fc.oneof(
    fc.array(arbA).map(View.fromArray),
    fp4tsList(arbA).map(View.fromList),
    fp4tsLazyList(arbA).map(View.fromLazyList),
    fp4tsVector(arbA).map(View.fromIterable),
  );
