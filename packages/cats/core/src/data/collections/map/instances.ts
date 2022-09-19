// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, lazyVal } from '@fp4ts/core';
import { Eq, Ord } from '@fp4ts/cats-kernel';
import { SemigroupK } from '../../../semigroup-k';
import { MonoidK } from '../../../monoid-k';
import { Functor } from '../../../functor';
import { FunctorWithIndex } from '../../../functor-with-index';
import { FoldableWithIndex } from '../../../foldable-with-index';
import { TraversableWithIndex } from '../../../traversable-with-index';
import { FunctorFilter } from '../../../functor-filter';

import { MapF } from './map';
import {
  all_,
  any_,
  collect_,
  count_,
  equals_,
  foldLeft_,
  foldMap_,
  isEmpty,
  map_,
  nonEmpty,
  sequence,
  traverse_,
  union_,
} from './operators';
import { empty } from './constructors';
import { Map } from './map';

export const mapEq: <K, V>(EK: Eq<K>, EV: Eq<V>) => Eq<Map<K, V>> = (EK, EV) =>
  Eq.of({ equals: (xs, ys) => equals_(EK, EV, xs, ys) });

export const mapSemigroupK: <K>(O: Ord<K>) => SemigroupK<$<MapF, [K]>> = O =>
  SemigroupK.of({ combineK_: (x, y) => union_(O, x, y()) });

export const mapMonoidK: <K>(O: Ord<K>) => MonoidK<$<MapF, [K]>> = <K>(
  O: Ord<K>,
) =>
  MonoidK.of<$<MapF, [K]>>({
    emptyK: () => empty,
    combineK_: (x, y) => union_(O, x, y()),
  });

export const mapFunctor: <K>() => Functor<$<MapF, [K]>> = lazyVal(<K>() =>
  Functor.of<$<MapF, [K]>>({ map_: (fa, f) => map_(fa, x => f(x)) }),
) as <K>() => Functor<$<MapF, [K]>>;

export const mapFunctorWithIndex: <K>() => FunctorWithIndex<$<MapF, [K]>, K> =
  lazyVal(<K>() =>
    FunctorWithIndex.of<$<MapF, [K]>, K>({ mapWithIndex_: map_ }),
  ) as <K>() => FunctorWithIndex<$<MapF, [K]>, K>;

export const mapFunctorFilter: <K>() => FunctorFilter<$<MapF, [K]>> = lazyVal(
  () =>
    FunctorFilter.of({
      ...mapFunctor(),
      mapFilter_: (fa, p) => collect_(fa, x => p(x)),
    }),
);

export const mapFoldableWithIndex: <K>() => FoldableWithIndex<$<MapF, [K]>, K> =
  lazyVal(<K>() =>
    FoldableWithIndex.of<$<MapF, [K]>, K>({
      foldLeftWithIndex_: foldLeft_,
      foldMapWithIndex_: foldMap_,
      all_: (m, p) => all_(m, x => p(x)),
      any_: (m, p) => any_(m, x => p(x)),
      count_: (m, p) => count_(m, x => p(x)),
      isEmpty: isEmpty,
      nonEmpty: nonEmpty,
      size: x => x.size,
    }),
  ) as <K>() => FoldableWithIndex<$<MapF, [K]>, K>;

export const mapTraversableWithIndex: <K>() => TraversableWithIndex<
  $<MapF, [K]>,
  K
> = lazyVal(<K>() =>
  TraversableWithIndex.of<$<MapF, [K]>, K>({
    ...mapFunctorWithIndex<K>(),
    ...mapFoldableWithIndex<K>(),
    traverseWithIndex_: traverse_,
    sequence: sequence,
  }),
) as <K>() => TraversableWithIndex<$<MapF, [K]>, K>;
