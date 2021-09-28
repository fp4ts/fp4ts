import { $ } from '@cats4ts/core';
import { Eq } from '../../../eq';
import { SemigroupK } from '../../../semigroup-k';
import { MonoidK } from '../../../monoid-k';
import { Functor } from '../../../functor';
import { FunctorFilter } from '../../../functor-filter';
import { UnorderedFoldable } from '../../../unordered-foldable';
import { UnorderedTraversable } from '../../../unordered-traversable';

import { HashMapK } from './hash-map';
import {
  all_,
  any_,
  collect_,
  count_,
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

export const hashMapSemigroupK: <K>(E: Eq<K>) => SemigroupK<$<HashMapK, [K]>> =
  E => SemigroupK.of({ combineK_: (x, y) => union_(E, x, y()) });

export const hashMapMonoidK: <K>(E: Eq<K>) => MonoidK<$<HashMapK, [K]>> = E =>
  MonoidK.of({
    emptyK: () => empty,
    combineK_: (x, y) => union_(E, x, y()),
  });

export const hashMapFunctor: <K>() => Functor<$<HashMapK, [K]>> = () =>
  Functor.of({ map_ });

export const hashMapFunctorFilter: <K>() => FunctorFilter<$<HashMapK, [K]>> =
  () =>
    FunctorFilter.of({
      ...hashMapFunctor(),
      mapFilter_: collect_,
    });

export const hashMapUnorderedFoldable: <K>() => UnorderedFoldable<
  $<HashMapK, [K]>
> = () =>
  UnorderedFoldable.of({
    unorderedFoldMap_: foldMap_,
    all_: all_,
    any_: any_,
    count_: count_,
    isEmpty: isEmpty,
    nonEmpty: nonEmpty,
    size: size,
  });

export const hashMapUnorderedTraversable: <K>() => UnorderedTraversable<
  $<HashMapK, [K]>
> = () =>
  UnorderedTraversable.of({
    ...hashMapUnorderedFoldable(),

    unorderedTraverse_: traverse_,
    unorderedSequence: sequence,
  });
