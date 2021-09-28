import { $ } from '@cats4ts/core';
import { Ord } from '../../../ord';
import { SemigroupK } from '../../../semigroup-k';
import { MonoidK } from '../../../monoid-k';
import { Functor } from '../../../functor';
import { FunctorFilter } from '../../../functor-filter';
import { Foldable } from '../../../foldable';
import { Traversable } from '../../../traversable';

import { OrderedMapK } from './ordered-map';
import {
  all_,
  any_,
  collect_,
  count_,
  foldLeft_,
  foldMap_,
  foldRight_,
  isEmpty,
  map_,
  nonEmpty,
  sequence,
  size,
  traverse_,
  union_,
} from './operators';
import { empty } from './constructors';

export const orderedMapSemigroupK: <K>(
  O: Ord<K>,
) => SemigroupK<$<OrderedMapK, [K]>> = O =>
  SemigroupK.of({ combineK_: (x, y) => union_(O, x, y()) });

export const orderedMapMonoidK: <K>(
  O: Ord<K>,
) => SemigroupK<$<OrderedMapK, [K]>> = O =>
  MonoidK.of({
    emptyK: () => empty,
    combineK_: (x, y) => union_(O, x, y()),
  });

export const orderedMapFunctor: <K>() => Functor<$<OrderedMapK, [K]>> = () =>
  Functor.of({ map_ });

export const orderedMapFunctorFilter: <K>() => FunctorFilter<
  $<OrderedMapK, [K]>
> = () =>
  FunctorFilter.of({
    ...orderedMapFunctor(),
    mapFilter_: collect_,
  });

export const orderedMapFoldable: <K>() => Foldable<$<OrderedMapK, [K]>> = () =>
  Foldable.of({
    foldLeft_: foldLeft_,
    foldRight_: foldRight_,
    foldMap_: foldMap_,
    all_: all_,
    any_: any_,
    count_: count_,
    isEmpty: isEmpty,
    nonEmpty: nonEmpty,
    size: size,
  });

export const orderedMapTraversable: <K>() => Traversable<$<OrderedMapK, [K]>> =
  () =>
    Traversable.of({
      ...orderedMapFunctor(),
      ...orderedMapFoldable(),

      traverse_: traverse_,
      sequence: sequence,
    });
