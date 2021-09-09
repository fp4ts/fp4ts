import { Monoid } from '../../monoid';
import { MonoidK } from '../../monoid-k';
import { SemigroupK } from '../../semigroup-k';
import { Apply } from '../../apply';
import { Applicative } from '../../applicative';
import { FlatMap } from '../../flat-map';
import { Functor } from '../../functor';
import { Monad } from '../../monad';
import { Foldable } from '../../foldable';
import { Traversable } from '../../traversable';
import { FunctorFilter } from '../../functor-filter';

import { URI } from './array';
import {
  all_,
  any_,
  collect_,
  concat_,
  count_,
  flatMap_,
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
import { empty, pure } from './constructors';

export const arraySemigroupK: () => SemigroupK<URI> = () =>
  SemigroupK.of({ URI, combineK_: concat_ });

export const arrayMonoidK: () => MonoidK<URI> = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { algebra, ...rest } = arraySemigroupK();
  return MonoidK.of({ ...rest, emptyK: () => empty });
};

export const arrayFunctor: () => Functor<URI> = () => Functor.of({ URI, map_ });

export const arrayFilterFunctor: () => FunctorFilter<URI> = () =>
  FunctorFilter.of({
    ...arrayFunctor(),
    mapFilter_: collect_,
  });

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

export const arrayFoldable: () => Foldable<URI> = () =>
  Foldable.of({
    URI: URI,
    all_: all_,
    any_: any_,
    count_: count_,
    foldMap_:
      <M>(M: Monoid<M>) =>
      <A>(xs: A[], f: (a: A) => M) =>
        foldMap_(xs, f, M),
    foldLeft_: foldLeft_,
    foldRight_: foldRight_,
    isEmpty: isEmpty,
    nonEmpty: nonEmpty,
    size: size,
  });

export const arrayTraversable: () => Traversable<URI> = () =>
  Traversable.of({
    ...arrayFunctor(),
    ...arrayFoldable(),
    traverse_: traverse_,
    sequence: sequence,
  });
