// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Kind, lazyVal } from '@fp4ts/core';
import { Eq, Monoid } from '@fp4ts/cats-kernel';
import { SemigroupK } from '../../../semigroup-k';
import { MonoidK } from '../../../monoid-k';
import { Functor } from '../../../functor';
import { Applicative } from '../../../applicative';
import { FunctorFilter } from '../../../functor-filter';
import { UnorderedFoldable } from '../../../unordered-foldable';
import { UnorderedTraversable } from '../../../unordered-traversable';

import { HashMap, HashMapF } from './hash-map';
import {
  all_,
  any_,
  collect_,
  count_,
  equals_,
  foldMap_,
  isEmpty,
  map_,
  nonEmpty,
  sequence,
  size,
  traverse_,
  union_,
} from './operators';
import { empty } from './constructors';

export const hashMapEq: <K, V>(EK: Eq<K>, EV: Eq<V>) => Eq<HashMap<K, V>> = (
  EK,
  EV,
) => Eq.of({ equals: (x, y) => equals_(EK, EV, x, y) });

export const hashMapSemigroupK: <K>(
  E: Eq<K>,
) => SemigroupK<$<HashMapF, [K]>> = E =>
  SemigroupK.of({ combineK_: (x, y) => union_(E, x, y) });

export const hashMapMonoidK: <K>(E: Eq<K>) => MonoidK<$<HashMapF, [K]>> = <K>(
  E: Eq<K>,
) =>
  MonoidK.of<$<HashMapF, [K]>>({
    emptyK: () => empty,
    combineK_: (x, y) => union_(E, x, y),
  });

export const hashMapFunctor: <K>() => Functor<$<HashMapF, [K]>> = lazyVal(<
  K,
>() =>
  Functor.of<$<HashMapF, [K]>>({ map_: (m, f) => map_(m, v => f(v)) }),
) as <K>() => Functor<$<HashMapF, [K]>>;

export const hashMapFunctorFilter: <K>() => FunctorFilter<$<HashMapF, [K]>> =
  lazyVal(() =>
    FunctorFilter.of({
      ...hashMapFunctor(),
      mapFilter_: (m, f) => collect_(m, v => f(v)),
    }),
  );

export const hashMapUnorderedFoldable: <K>() => UnorderedFoldable<
  $<HashMapF, [K]>
> = lazyVal(<K>() =>
  UnorderedFoldable.of<$<HashMapF, [K]>>({
    unorderedFoldMap_:
      <M>(M: Monoid<M>) =>
      <K, V>(m: HashMap<K, V>, f: (v: V) => M) =>
        foldMap_<M>(M)(m, x => f(x)),
    all_: (m, p) => all_(m, v => p(v)),
    any_: (m, p) => any_(m, v => p(v)),
    count_: (m, p) => count_(m, v => p(v)),
    isEmpty: isEmpty,
    nonEmpty: nonEmpty,
    size: size,
  }),
) as <K>() => UnorderedFoldable<$<HashMapF, [K]>>;

export const hashMapUnorderedTraversable: <K>() => UnorderedTraversable<
  $<HashMapF, [K]>
> = lazyVal(() =>
  UnorderedTraversable.of({
    ...hashMapUnorderedFoldable(),

    unorderedTraverse_:
      <G>(G: Applicative<G>) =>
      <K, V, B>(m: HashMap<K, V>, f: (v: V) => Kind<G, [B]>) =>
        traverse_(G)(m, x => f(x)),
    unorderedSequence: sequence,
  }),
);
