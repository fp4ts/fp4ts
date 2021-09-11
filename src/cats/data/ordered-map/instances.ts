import { Lazy, URI, V } from '../../../core';
import { Functor } from '../../functor';
import { FunctorFilter } from '../../functor-filter';
import { Foldable } from '../../foldable';
import { Traversable } from '../../traversable';

import { OrderedMapURI } from './ordered-map';
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
} from './operators';

export type Variance = V<'E', '+'> & V<'A', '+'>;

export const orderedMapFunctor: Lazy<
  Functor<[URI<OrderedMapURI, Variance>], Variance>
> = () => Functor.of({ map_ });

export const orderedMapFunctorFilter: Lazy<
  FunctorFilter<[URI<OrderedMapURI, Variance>], Variance>
> = () =>
  FunctorFilter.of({
    ...orderedMapFunctor(),
    mapFilter_: collect_,
  });

export const orderedMapFoldable: Lazy<
  Foldable<[URI<OrderedMapURI, Variance>], Variance>
> = () =>
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

export const orderedMapTraversable: Lazy<
  Traversable<[URI<OrderedMapURI, Variance>], Variance>
> = () =>
  Traversable.of({
    ...orderedMapFunctor(),
    ...orderedMapFoldable(),

    traverse_: traverse_,
    sequence: sequence,
  });
