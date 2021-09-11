import { URI, V } from '../../../core';

import { Lazy } from '../../../fp/core';
import { SemigroupK } from '../../semigroup-k';
import { MonoidK } from '../../monoid-k';
import { Applicative } from '../../applicative';
import { Alternative } from '../../alternative';
import { Apply } from '../../apply';
import { FlatMap } from '../../flat-map';
import { Functor } from '../../functor';
import { FunctorFilter } from '../../functor-filter';
import { Monad } from '../../monad';
import { Foldable } from '../../foldable';
import { Traversable } from '../../traversable';
import { ListURI } from './list';

import { empty, pure } from './constructors';
import {
  all_,
  any_,
  collect_,
  concat_,
  count_,
  flatMap_,
  flatten,
  foldLeft_,
  foldMap_,
  foldRight_,
  isEmpty,
  map_,
  nonEmpty,
  sequence,
  size,
  tap_,
  traverse_,
} from './operators';

export type Variance = V<'A', '+'>;

export const listSemigroupK: Lazy<
  SemigroupK<[URI<ListURI, Variance>], Variance>
> = () => SemigroupK.of({ combineK_: concat_ });

export const listMonoidK: Lazy<MonoidK<[URI<ListURI, Variance>], Variance>> =
  () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { algebra, ...rest } = listSemigroupK();
    return MonoidK.of({ ...rest, emptyK: () => empty });
  };

export const listFunctor: Lazy<Functor<[URI<ListURI, Variance>], Variance>> =
  () => Functor.of({ map_ });

export const listFunctorFilter: Lazy<
  FunctorFilter<[URI<ListURI, Variance>], Variance>
> = () =>
  FunctorFilter.of({
    ...listFunctor(),
    mapFilter_: collect_,
  });

export const listApply: Lazy<Apply<[URI<ListURI, Variance>], Variance>> = () =>
  Apply.of({
    ...listFunctor(),
    ap_: (ff, fa) => flatMap_(ff, f => map_(fa, a => f(a))),
  });

export const listApplicative: Lazy<
  Applicative<[URI<ListURI, Variance>], Variance>
> = () =>
  Applicative.of({
    ...listApply(),
    pure: pure,
    unit: () => empty,
  });

export const listAlternative: Lazy<
  Alternative<[URI<ListURI, Variance>], Variance>
> = () =>
  Alternative.of({
    ...listApplicative(),
    ...listMonoidK(),
  });

export const listFlatMap: Lazy<FlatMap<[URI<ListURI, Variance>], Variance>> =
  () =>
    FlatMap.of({
      ...listApply(),
      flatMap_: flatMap_,
      flatTap_: tap_,
      flatten: flatten,
    });

export const listMonad: Lazy<Monad<[URI<ListURI, Variance>], Variance>> = () =>
  Monad.of({
    ...listApplicative(),
    ...listFlatMap(),
  });

export const listFoldable: Lazy<Foldable<[URI<ListURI, Variance>], Variance>> =
  () =>
    Foldable.of({
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

export const listTraversable: Lazy<
  Traversable<[URI<ListURI, Variance>], Variance>
> = () =>
  Traversable.of({
    ...listFoldable(),
    ...listFunctor(),
    traverse_: traverse_,
    sequence: sequence,
  });
