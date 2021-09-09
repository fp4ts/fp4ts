import { Lazy } from '../../../fp/core';
import { SemigroupK } from '../../semigroup-k';
import { MonoidK } from '../../monoid-k';
import { Applicative } from '../../applicative';
import { Alternative } from '../../alternative';
import { Apply } from '../../apply';
import { FlatMap } from '../../flat-map';
import { Functor } from '../../functor';
import { Monad } from '../../monad';
import { Foldable } from '../../foldable';
import { Traversable } from '../../traversable';
import { URI } from './list';

import { empty, pure } from './constructors';
import {
  all,
  all_,
  any,
  any_,
  concat_,
  count,
  count_,
  flatMap_,
  flatten,
  foldLeft,
  foldLeft_,
  foldMap,
  foldMap_,
  foldRight,
  foldRight_,
  isEmpty,
  map_,
  nonEmpty,
  sequence,
  size,
  tap_,
  traverse,
} from './operators';

export const listSemigroupK: Lazy<SemigroupK<URI>> = () =>
  SemigroupK.of({ URI, combineK_: concat_ });

export const listMonoidK: Lazy<MonoidK<URI>> = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { algebra, ...rest } = listSemigroupK();
  return MonoidK.of({ ...rest, emptyK: () => empty });
};

export const listFunctor: Lazy<Functor<URI>> = () => Functor.of({ URI, map_ });

export const listApply: Lazy<Apply<URI>> = () =>
  Apply.of({
    ...listFunctor(),
    ap_: (ff, fa) => flatMap_(ff, f => map_(fa, a => f(a))),
  });

export const listApplicative: Lazy<Applicative<URI>> = () =>
  Applicative.of({
    ...listApply(),
    pure: pure,
    unit: empty,
  });

export const listAlternative: Lazy<Alternative<URI>> = () =>
  Alternative.of({
    ...listApplicative(),
    ...listMonoidK(),
  });

export const listFlatMap: Lazy<FlatMap<URI>> = () =>
  FlatMap.of({
    ...listApply(),
    flatMap_: flatMap_,
    flatTap_: tap_,
    flatten: flatten,
  });

export const listMonad: Lazy<Monad<URI>> = () =>
  Monad.of({
    ...listApplicative(),
    ...listFlatMap(),
  });

export const listFoldable: Lazy<Foldable<URI>> = () =>
  Foldable.of({
    URI: URI,
    isEmpty: isEmpty,
    nonEmpty: nonEmpty,
    size: size,
    all_: all_,
    any_: any_,
    count_: count_,
    foldMap_: foldMap_,
    foldLeft_: foldLeft_,
    foldRight_: foldRight_,
  });

export const listTraversable: Lazy<Traversable<URI>> = () => ({
  ...listFoldable(),
  ...listFunctor(),
  traverse: traverse,
  sequence: sequence,
});
