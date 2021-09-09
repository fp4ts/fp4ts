import { Lazy } from '../../../fp/core';
import { Functor2C, Functor2 } from '../../functor';
import { Foldable2C, Foldable2 } from '../../foldable';
import { Traversable2, Traversable2C } from '../../traversable';

import { URI } from './map';
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

export const mapFunctor2C: <K>() => Functor2C<URI, K> = () =>
  Functor2C.of({ URI, map_ });

export const mapFunctor2: Lazy<Functor2<URI>> = () =>
  Functor2.of({ URI, map_ });

export const mapFoldable2C: <K>() => Foldable2C<URI, K> = () => ({
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

export const mapFoldable2: Lazy<Foldable2<URI>> = () => ({
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

export const mapTraversable2C: <E>() => Traversable2C<URI, E> = () => ({
  ...mapFunctor2C(),
  ...mapFoldable2C(),

  traverse: traverse,
  sequence: sequence,
});

export const mapTraversable2: Lazy<Traversable2<URI>> = () => ({
  ...mapFunctor2(),
  ...mapFoldable2(),

  traverse: traverse,
  sequence: sequence,
});
