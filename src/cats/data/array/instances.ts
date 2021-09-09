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
  flatMap,
  flatMap_,
  flatten,
  foldLeft,
  foldMap,
  foldRight,
  isEmpty,
  map,
  map_,
  nonEmpty,
  sequence,
  size,
  tap,
  traverse,
} from './operators';
import { pure } from './constructors';

export const arraySemigroupK: () => SemigroupK<URI> = () => ({
  URI: URI,

  combineK: concat_,

  algebra: () => ({
    combine: concat_,
  }),
});

export const arrayMonoidK: () => MonoidK<URI> = () => ({
  ...arraySemigroupK(),

  emptyK: () => [],

  algebra: () => ({
    empty: [],
    combine: concat_,
  }),
});

export const arrayFunctor: () => Functor<URI> = () => Functor.of({ URI, map_ });

export const arrayApply: () => Apply<URI> = () => ({
  ...arrayFunctor(),
  ap: ff => fa => flatMap_(ff, f => map_(fa, f)),
  map2: (fa, fb) => f => flatMap_(fa, a => map_(fb, b => f(a, b))),
  product: (fa, fb) => flatMap_(fa, a => map_(fb, b => [a, b])),
  productL: fa => fa,
  productR: (_, fb) => fb,
});

export const arrayApplicative: () => Applicative<URI> = () => ({
  ...arrayApply(),
  pure: pure,
  unit: [],
});

export const arrayFlatMap: () => FlatMap<URI> = () => ({
  ...arrayApply(),
  flatMap: flatMap,
  flatTap: tap,
  flatten: flatten,
});

export const arrayMonad: () => Monad<URI> = () => ({
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
