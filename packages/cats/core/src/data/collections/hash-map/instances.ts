import { $ } from '@cats4ts/core';
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
} from './operators';

export const mapFunctor: <K>() => Functor<$<HashMapK, [K]>> = () =>
  Functor.of({ map_ });

export const mapFunctorFilter: <K>() => FunctorFilter<$<HashMapK, [K]>> = () =>
  FunctorFilter.of({
    ...mapFunctor(),
    mapFilter_: collect_,
  });

export const mapUnorderedFoldable: <K>() => UnorderedFoldable<
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

export const mapUnorderedTraversable: <K>() => UnorderedTraversable<
  $<HashMapK, [K]>
> = () =>
  UnorderedTraversable.of({
    ...mapUnorderedFoldable(),

    unorderedTraverse_: traverse_,
    unorderedSequence: sequence,
  });
