import { getMonoidKAlgebra, MonoidK } from '../../monoid-k';
import { getSemigroupKAlgebra, SemigroupK } from '../../semigroup-k';
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
  flatSequence,
  flatten,
  flatTraverse,
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
  _URI: URI,

  combineK: concat_,

  algebra: getSemigroupKAlgebra(arraySemigroupK()),
});

export const arrayMonoidK: () => MonoidK<URI> = () => ({
  ...arraySemigroupK(),

  emptyK: () => [],

  algebra: getMonoidKAlgebra(arrayMonoidK()),
});

export const arrayFunctor: () => Functor<URI> = () => ({
  _URI: URI,

  map: map,

  tap: tap,
});

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
  _URI: URI,
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
  flatTraverse: (_, G) => flatTraverse(G),
  flatSequence: (_, G) => flatSequence(G),
});
