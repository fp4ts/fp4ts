// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Kind, lazyVal } from '@fp4ts/core';
import { Eq } from '../../../eq';
import { Monoid } from '../../../monoid';
import { SemigroupK } from '../../../semigroup-k';
import { MonoidK } from '../../../monoid-k';
import { Functor } from '../../../functor';
import { Applicative } from '../../../applicative';
import { FunctorFilter } from '../../../functor-filter';
import { UnorderedFoldable } from '../../../unordered-foldable';
import { UnorderedTraversable } from '../../../unordered-traversable';

import { HashMap, HashMapK } from './hash-map';
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

export const hashMapSemigroupK: <K>(E: Eq<K>) => SemigroupK<$<HashMapK, [K]>> =
  E => SemigroupK.of({ combineK_: (x, y) => union_(E, x, y()) });

export const hashMapMonoidK: <K>(E: Eq<K>) => MonoidK<$<HashMapK, [K]>> = E =>
  MonoidK.of({
    emptyK: () => empty,
    combineK_: (x, y) => union_(E, x, y()),
  });

export const hashMapFunctor: <K>() => Functor<$<HashMapK, [K]>> = lazyVal(() =>
  Functor.of({ map_: (m, f) => map_(m, v => f(v)) }),
);

export const hashMapFunctorFilter: <K>() => FunctorFilter<$<HashMapK, [K]>> =
  lazyVal(() =>
    FunctorFilter.of({
      ...hashMapFunctor(),
      mapFilter_: (m, f) => collect_(m, v => f(v)),
    }),
  );

export const hashMapUnorderedFoldable: <K>() => UnorderedFoldable<
  $<HashMapK, [K]>
> = lazyVal(() =>
  UnorderedFoldable.of({
    unorderedFoldMap_:
      <M>(M: Monoid<M>) =>
      <K, V>(m: HashMap<K, V>, f: (v: V) => M) =>
        foldMap_(M)(m, x => f(x)),
    all_: (m, p) => all_(m, v => p(v)),
    any_: (m, p) => any_(m, v => p(v)),
    count_: (m, p) => count_(m, v => p(v)),
    isEmpty: isEmpty,
    nonEmpty: nonEmpty,
    size: size,
  }),
);

export const hashMapUnorderedTraversable: <K>() => UnorderedTraversable<
  $<HashMapK, [K]>
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
