import { SemigroupK } from '../../semigroup-k';
import { MonoidK } from '../../monoid-k';
import { Applicative } from '../../applicative';
import { Apply } from '../../apply';
import { FlatMap } from '../../flat-map';
import { Functor } from '../../functor';
import { Foldable } from '../../foldable';
import { Traversable } from '../../traversable';
import { URI } from './list';

import { empty, pure } from './constructors';
import {
  concat_,
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

export const listSemigroupK: () => SemigroupK<URI> = () => ({
  _URI: URI,
  combineK: concat_,
  algebra: () => ({
    combine: concat_,
  }),
});

export const listMonoidK: () => MonoidK<URI> = () => ({
  ...listSemigroupK(),
  emptyK: () => empty,
  algebra: () => ({
    empty: empty,
    combine: concat_,
  }),
});

export const listFunctor: () => Functor<URI> = () => ({
  _URI: URI,
  map: map,
  tap: tap,
});

export const listApply: () => Apply<URI> = () => ({
  ...listFunctor(),
  ap: ff => fa => flatMap_(ff, f => map_(fa, a => f(a))),
  map2: (fa, fb) => f => flatMap_(fa, a => map_(fb, b => f(a, b))),
  product: (fa, fb) => flatMap_(fa, a => map_(fb, b => [a, b])),
  productL: fa => fa,
  productR: (_, fb) => fb,
});

export const listApplicative: () => Applicative<URI> = () => ({
  ...listApply(),
  pure: pure,
  unit: empty,
});

export const listFlatMap: () => FlatMap<URI> = () => ({
  ...listApply(),
  flatMap: flatMap,
  flatten: flatten,
  flatTap: tap,
});

export const listFoldable: () => Foldable<URI> = () => ({
  _URI: URI,
  isEmpty: isEmpty,
  nonEmpty: nonEmpty,
  size: size,
  all: null as any,
  any: null as any,
  count: null as any,
  foldMap: foldMap,
  foldLeft: foldLeft,
  foldRight: foldRight,
});

export const listTraversable: () => Traversable<URI> = () => ({
  ...listFoldable(),
  ...listFunctor(),
  traverse: traverse,
  sequence: sequence,
  flatTraverse: (_, G) => flatTraverse(G),
  flatSequence: (_, G) => flatSequence(G),
});
