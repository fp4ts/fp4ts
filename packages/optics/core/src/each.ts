// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  ArrayF,
  Either,
  EitherF,
  Option,
  OptionF,
  Traversable,
} from '@fp4ts/cats';
import {
  LazyList,
  LazyListF,
  List,
  ListF,
  Map,
  MapF,
  Seq,
  SeqF,
  Vector,
  VectorF,
} from '@fp4ts/collections';
import { $, Kind, lazy } from '@fp4ts/core';
import { PTraversal, traversal, Traversal } from './traversal';

export interface Each<F> {
  <A, B>(): PTraversal<Kind<F, [A]>, Kind<F, [B]>, A, B>;
  <A>(): Traversal<Kind<F, [A]>, A>;
}

function Tuple<
  S extends unknown[],
  T extends unknown[],
>(): S['length'] extends T['length'] ? PTraversal<S, T, S[0], T[0]> : never;
function Tuple<S extends unknown[]>(): Traversal<S, S[0]>;
function Tuple<S extends unknown[]>(): Traversal<S, S[0]> {
  return Each.Array() as any;
}

export const Each = Object.freeze({
  Tuple,

  Array: lazy(
    <A, B>(): PTraversal<A[], B[], A, B> =>
      traversal<A[], B[], A, B>(Traversable.Array.traverse),
  ) as Each<ArrayF>,

  List: lazy(
    <A, B>(): PTraversal<List<A>, List<B>, A, B> =>
      traversal<List<A>, List<B>, A, B>(List.TraversableFilter.traverse),
  ) as Each<ListF>,

  LazyList: lazy(
    <A, B>(): PTraversal<LazyList<A>, LazyList<B>, A, B> =>
      traversal<LazyList<A>, LazyList<B>, A, B>(
        LazyList.TraversableFilter.traverse,
      ),
  ) as Each<LazyListF>,

  Seq: lazy(
    <A, B>(): PTraversal<Seq<A>, Seq<B>, A, B> =>
      traversal<Seq<A>, Seq<B>, A, B>(Seq.Traversable.traverse),
  ) as Each<SeqF>,

  Vector: lazy(
    <A, B>(): PTraversal<Vector<A>, Vector<B>, A, B> =>
      traversal<Vector<A>, Vector<B>, A, B>(Vector.Traversable.traverse),
  ) as Each<VectorF>,

  Option: lazy(
    <A, B>(): PTraversal<Option<A>, Option<B>, A, B> =>
      traversal<Option<A>, Option<B>, A, B>(Option.TraversableFilter.traverse),
  ) as Each<OptionF>,

  Either: lazy(
    <C>(): Each<$<EitherF, [C]>> =>
      <A, B>(): PTraversal<Either<C, A>, Either<C, B>, A, B> =>
        traversal<Either<C, A>, Either<C, B>, A, B>(
          Either.Traversable<C>().traverse,
        ),
  ) as <C>() => Each<$<EitherF, [C]>>,

  Map: lazy(
    <K>(): Each<$<MapF, [K]>> =>
      <A, B>(): PTraversal<Map<K, A>, Map<K, B>, A, B> =>
        traversal<Map<K, A>, Map<K, B>, A, B>(
          Map.TraversableWithIndex<K>().traverse,
        ),
  ) as <K>() => Each<$<MapF, [K]>>,
});

export const each = Each.Array;
export const eachTuple = Each.Tuple;
