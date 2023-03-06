// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, lazy } from '@fp4ts/core';
import {
  Eq,
  FoldableWithIndex,
  Functor,
  FunctorFilter,
  FunctorWithIndex,
  MonoidK,
  Ord,
  SemigroupK,
  TraversableWithIndex,
} from '@fp4ts/cats';

import { MapF } from './map';
import {
  all_,
  any_,
  collect_,
  count_,
  equals_,
  foldLeft_,
  foldMapK_,
  foldMapLeft_,
  foldMap_,
  foldRight_,
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
  SemigroupK.of({
    combineK_: (x, y) => union_(O, x, y),
    combineKEval_: (x, ey) => (x === empty ? ey : ey.map(y => union_(O, x, y))),
  });

export const mapMonoidK: <K>(O: Ord<K>) => MonoidK<$<MapF, [K]>> = <K>(
  O: Ord<K>,
) =>
  MonoidK.of<$<MapF, [K]>>({
    emptyK: () => empty,
    combineK_: (x, y) => union_(O, x, y),
    combineKEval_: (x, ey) => (x === empty ? ey : ey.map(y => union_(O, x, y))),
  });

export const mapFunctor: <K>() => Functor<$<MapF, [K]>> = lazy(<K>() =>
  Functor.of<$<MapF, [K]>>({ map_: (fa, f) => map_(fa, x => f(x)) }),
) as <K>() => Functor<$<MapF, [K]>>;

export const mapFunctorWithIndex: <K>() => FunctorWithIndex<$<MapF, [K]>, K> =
  lazy(<K>() =>
    FunctorWithIndex.of<$<MapF, [K]>, K>({ mapWithIndex_: map_ }),
  ) as <K>() => FunctorWithIndex<$<MapF, [K]>, K>;

export const mapFunctorFilter: <K>() => FunctorFilter<$<MapF, [K]>> = lazy(() =>
  FunctorFilter.of({
    ...mapFunctor(),
    mapFilter_: (fa, p) => collect_(fa, x => p(x)),
  }),
);

export const mapFoldableWithIndex: <K>() => FoldableWithIndex<$<MapF, [K]>, K> =
  lazy(<K>() =>
    FoldableWithIndex.of<$<MapF, [K]>, K>({
      foldLeftWithIndex_: foldLeft_,
      foldRightWithIndex_: foldRight_,
      foldMapLeftWithIndex_: foldMapLeft_,
      foldMapWithIndex_: foldMap_,
      foldMapKWithIndex_: foldMapK_,
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
> = lazy(<K>() =>
  TraversableWithIndex.of<$<MapF, [K]>, K>({
    ...mapFunctorWithIndex<K>(),
    ...mapFoldableWithIndex<K>(),
    traverseWithIndex_: traverse_,
    sequence: sequence,
  }),
) as <K>() => TraversableWithIndex<$<MapF, [K]>, K>;
