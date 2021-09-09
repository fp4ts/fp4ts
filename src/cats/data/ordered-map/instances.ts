import { Lazy } from '../../../fp/core';
import { Functor2C, Functor2 } from '../../functor';
import { Foldable2, Foldable2C } from '../../foldable';
import { Traversable2C, Traversable2 } from '../../traversable';

import { URI } from './ordered-map';
import {
  all_,
  any_,
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

export const orderedMapFunctor2C: <K>() => Functor2C<URI, K> = () =>
  Functor2C.of({ URI, map_ });

export const orderedMapFunctor2: Lazy<Functor2<URI>> = () =>
  Functor2.of({ URI, map_ });

export const orderedMapFoldable2C: <K>() => Foldable2C<URI, K> = () =>
  Foldable2C.of({
    URI: URI,
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

export const orderedMapFoldable2: Lazy<Foldable2<URI>> = () =>
  Foldable2.of({
    URI: URI,
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

export const orderedMapTraversable2C: <K>() => Traversable2C<URI, K> = () =>
  Traversable2C.of({
    ...orderedMapFunctor2C(),
    ...orderedMapFoldable2C(),

    traverse_: traverse_,
    sequence: sequence,
  });

export const orderedMapTraversable2: Lazy<Traversable2<URI>> = () =>
  Traversable2.of({
    ...orderedMapFunctor2(),
    ...orderedMapFoldable2(),

    traverse_: traverse_,
    sequence: sequence,
  });
