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

export const listSemigroupK: Lazy<SemigroupK<URI>> = () => ({
  URI: URI,
  combineK: concat_,
  algebra: () => ({
    combine: concat_,
  }),
});

export const listMonoidK: Lazy<MonoidK<URI>> = () => ({
  ...listSemigroupK(),
  emptyK: () => empty,
  algebra: () => ({
    empty: empty,
    combine: concat_,
  }),
});

export const listFunctor: Lazy<Functor<URI>> = () => ({
  URI: URI,
  map: map,
  tap: tap,
});

export const listApply: Lazy<Apply<URI>> = () => ({
  ...listFunctor(),
  ap: ff => fa => flatMap_(ff, f => map_(fa, a => f(a))),
  map2: (fa, fb) => f => flatMap_(fa, a => map_(fb, b => f(a, b))),
  product: (fa, fb) => flatMap_(fa, a => map_(fb, b => [a, b])),
  productL: fa => fa,
  productR: (_, fb) => fb,
});

export const listApplicative: Lazy<Applicative<URI>> = () => ({
  ...listApply(),
  pure: pure,
  unit: empty,
});

export const listAlternative: Lazy<Alternative<URI>> = () => ({
  ...listApplicative(),
  ...listMonoidK(),
});

export const listFlatMap: Lazy<FlatMap<URI>> = () => ({
  ...listApply(),
  flatMap: flatMap,
  flatten: flatten,
  flatTap: tap,
});

export const listMonad: Lazy<Monad<URI>> = () => ({
  ...listApplicative(),
  ...listFlatMap(),
});

export const listFoldable: Lazy<Foldable<URI>> = () => ({
  URI: URI,
  isEmpty: isEmpty,
  nonEmpty: nonEmpty,
  size: size,
  all: all,
  any: any,
  count: count,
  foldMap: foldMap,
  foldLeft: foldLeft,
  foldRight: foldRight,
});

export const listTraversable: Lazy<Traversable<URI>> = () => ({
  ...listFoldable(),
  ...listFunctor(),
  traverse: traverse,
  sequence: sequence,
});
