import { Lazy, URI, V } from '../../../core';
import { Functor } from '../../functor';
import { FunctorFilter } from '../../functor-filter';
import { Foldable } from '../../foldable';
import { Traversable } from '../../traversable';

import { MapURI } from './map';
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

export const mapFunctor: Lazy<Functor<[URI<MapURI, Variance>], Variance>> =
  () => Functor.of({ map_ });

export const mapFunctorFilter: Lazy<
  FunctorFilter<[URI<MapURI, Variance>], Variance>
> = () =>
  FunctorFilter.of({
    ...mapFunctor(),
    mapFilter_: collect_,
  });

export const mapFoldable: Lazy<Foldable<[URI<MapURI, Variance>], Variance>> =
  () =>
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

export const mapTraversable2: Lazy<
  Traversable<[URI<MapURI, Variance>], Variance>
> = () =>
  Traversable.of({
    ...mapFunctor(),
    ...mapFoldable(),

    traverse_: traverse_,
    sequence: sequence,
  });
