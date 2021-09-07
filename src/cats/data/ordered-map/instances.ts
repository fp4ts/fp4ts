import { Lazy } from '../../../fp/core';
import { Functor2C, Functor2 } from '../../functor';
import { Foldable2, Foldable2C } from '../../foldable';

import { URI } from './ordered-map';
import {
  all,
  any,
  count,
  foldLeft,
  foldMap,
  foldRight,
  isEmpty,
  map,
  nonEmpty,
  sequence,
  size,
  tap,
  traverse,
} from './operators';
import { Traversable2C } from '../..';

export const orderedMapFunctor2C: <K>() => Functor2C<URI, K> = () => ({
  URI: URI,
  map: map,
  tap: tap,
});

export const orderedMapFunctor2: Lazy<Functor2<URI>> = () => ({
  URI: URI,
  map: map,
  tap: tap,
});

export const orderedMapFoldable2C: <K>() => Foldable2C<URI, K> = () => ({
  URI: URI,
  foldLeft: foldLeft,
  foldRight: foldRight,
  foldMap: foldMap,
  all: all,
  any: any,
  count: count,
  isEmpty: isEmpty,
  nonEmpty: nonEmpty,
  size: size,
});

export const orderedMapFoldable2: Lazy<Foldable2<URI>> = () => ({
  URI: URI,
  foldLeft: foldLeft,
  foldRight: foldRight,
  foldMap: foldMap,
  all: all,
  any: any,
  count: count,
  isEmpty: isEmpty,
  nonEmpty: nonEmpty,
  size: size,
});

export const orderedTraversable2C: <K>() => Traversable2C<URI, K> = () => ({
  ...orderedMapFunctor2C(),
  ...orderedMapFoldable2C(),

  traverse: traverse,
  sequence: sequence,
});
