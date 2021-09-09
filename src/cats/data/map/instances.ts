import { Lazy } from '../../../fp/core';
import { Functor2C, Functor2 } from '../../functor';
import { Foldable2C, Foldable2 } from '../../foldable';
import { Traversable2, Traversable2C } from '../../traversable';

import { URI } from './map';
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
  traverse,
  traverse_,
} from './operators';

export const mapFunctor2C: <K>() => Functor2C<URI, K> = () =>
  Functor2C.of({ URI, map_ });

export const mapFunctor2: Lazy<Functor2<URI>> = () =>
  Functor2.of({ URI, map_ });

export const mapFoldable2C: <K>() => Foldable2C<URI, K> = () =>
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

export const mapFoldable2: Lazy<Foldable2<URI>> = () =>
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

export const mapTraversable2C: <E>() => Traversable2C<URI, E> = () =>
  Traversable2C.of({
    ...mapFunctor2C(),
    ...mapFoldable2C(),

    traverse_: traverse_,
    sequence: sequence,
  });

export const mapTraversable2: Lazy<Traversable2<URI>> = () =>
  Traversable2.of({
    ...mapFunctor2(),
    ...mapFoldable2(),

    traverse_: traverse_,
    sequence: sequence,
  });
