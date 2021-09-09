import { MonoidK } from '../../monoid-k';
import { SemigroupK } from '../../semigroup-k';
import { Apply } from '../../apply';
import { Applicative } from '../../applicative';
import { FlatMap } from '../../flat-map';
import { Functor } from '../../functor';
import { Monad } from '../../monad';
import { Foldable } from '../../foldable';
import { Traversable } from '../../traversable';

import { URI } from './array';
import {
  all,
  any,
  concat_,
  count,
  flatMap_,
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
import { empty, pure } from './constructors';

export const arraySemigroupK: () => SemigroupK<URI> = () =>
  SemigroupK.of({ URI, combineK_: concat_ });

export const arrayMonoidK: () => MonoidK<URI> = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { algebra, ...rest } = arraySemigroupK();
  return MonoidK.of({ ...rest, emptyK: () => empty });
};

export const arrayFunctor: () => Functor<URI> = () => Functor.of({ URI, map_ });

export const arrayApply: () => Apply<URI> = () =>
  Apply.of({
    ...arrayFunctor(),
    ap_: (ff, fa) => flatMap_(ff, f => map_(fa, f)),
  });

export const arrayApplicative: () => Applicative<URI> = () =>
  Applicative.of({ ...arrayApply(), pure: pure, unit: [] });

export const arrayFlatMap: () => FlatMap<URI> = () =>
  FlatMap.of({ ...arrayApply(), flatMap_: flatMap_ });

export const arrayMonad: () => Monad<URI> = () =>
  Monad.of({
    ...arrayApplicative(),
    ...arrayFlatMap(),
  });

export const arrayFoldable: () => Foldable<URI> = () => ({
  URI: URI,
  all: all,
  any: any,
  count: count,
  foldMap: foldMap,
  foldLeft: foldLeft,
  foldRight: foldRight,
  isEmpty: isEmpty,
  nonEmpty: nonEmpty,
  size: size,
});

export const arrayTraversable: () => Traversable<URI> = () => ({
  ...arrayFunctor(),
  ...arrayFoldable(),
  traverse: traverse,
  sequence: sequence,
});
