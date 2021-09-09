import { Lazy } from '../../../fp/core';
import { Functor2C, Functor2 } from '../../functor';
import { Foldable2, Foldable2C } from '../../foldable';
import { Traversable2C, Traversable2 } from '../../traversable';

import { URI } from './ordered-map';
import {
  all,
  any,
  count,
  foldLeft,
  foldMap,
  foldRight,
  isEmpty,
  map_,
  nonEmpty,
  sequence,
  size,
  traverse,
} from './operators';

export const orderedMapFunctor2C: <K>() => Functor2C<URI, K> = () =>
  Functor2C.of({ URI, map_ });

export const orderedMapFunctor2: Lazy<Functor2<URI>> = () =>
  Functor2.of({ URI, map_ });

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

export const orderedMapTraversable2C: <K>() => Traversable2C<URI, K> = () => ({
  ...orderedMapFunctor2C(),
  ...orderedMapFoldable2C(),

  traverse: traverse,
  sequence: sequence,
});

export const orderedMapTraversable2: Lazy<Traversable2<URI>> = () => ({
  ...orderedMapFunctor2(),
  ...orderedMapFoldable2(),

  traverse: traverse,
  sequence: sequence,
});
