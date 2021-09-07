import { Lazy } from '../../../fp/core';
import { Apply2C, Apply2 } from '../../apply';
import { Applicative2C, Applicative2 } from '../../applicative';
import { Functor2C, Functor2 } from '../../functor';
import { FlatMap2C, FlatMap2 } from '../../flat-map';
import { Monad2C, Monad2 } from '../../monad';

import { URI } from './either';
import {
  flatMap,
  flatMap_,
  flatTap,
  flatten,
  map,
  map_,
  tap,
} from './operators';
import { pure, rightUnit } from './constructors';

export const eitherFunctor2C: <E>() => Functor2C<URI, E> = () => ({
  URI: URI,
  map: map,
  tap: tap,
});

export const eitherFunctor2: Lazy<Functor2<URI>> = () => ({
  URI: URI,
  map: map,
  tap: tap,
});

export const eitherApply2C: <E>() => Apply2C<URI, E> = () => ({
  ...eitherFunctor2C(),
  ap: ff => fa => flatMap_(ff, f => map_(fa, a => f(a))),
  map2: (fa, fb) => f => flatMap_(fa, a => map_(fb, b => f(a, b))),
  product: (fa, fb) => flatMap_(fa, a => map_(fb, b => [a, b])),
  productL: (fa, fb) => flatMap_(fa, a => map_(fb, () => a)),
  productR: (fa, fb) => flatMap_(fa, () => map_(fb, b => b)),
});

export const eitherApply2: Lazy<Apply2<URI>> = () => ({
  ...eitherFunctor2(),
  ap: ff => fa => flatMap_(ff, f => map_(fa, a => f(a))),
  map2: (fa, fb) => f => flatMap_(fa, a => map_(fb, b => f(a, b))),
  product: (fa, fb) => flatMap_(fa, a => map_(fb, b => [a, b])),
  productL: (fa, fb) => flatMap_(fa, a => map_(fb, () => a)),
  productR: (fa, fb) => flatMap_(fa, () => map_(fb, b => b)),
});

export const eitherApplicative2C: <E>() => Applicative2C<URI, E> = () => ({
  ...eitherApply2C(),
  pure: pure,
  unit: rightUnit,
});

export const eitherApplicative2: Lazy<Applicative2<URI>> = () => ({
  ...eitherApply2(),
  pure: pure,
  unit: rightUnit,
});

export const eitherFlatMap2C: <E>() => FlatMap2C<URI, E> = () => ({
  ...eitherApply2C(),
  flatMap: flatMap,
  flatTap: flatTap,
  flatten: flatten,
});

export const eitherFlatMap2: Lazy<FlatMap2<URI>> = () => ({
  ...eitherApply2(),
  flatMap: flatMap,
  flatTap: flatTap,
  flatten: flatten,
});

export const eitherMonad2C: <E>() => Monad2C<URI, E> = () => ({
  ...eitherApplicative2C(),
  ...eitherFlatMap2C(),
});

export const eitherMonad2: Lazy<Monad2<URI>> = () => ({
  ...eitherApplicative2(),
  ...eitherFlatMap2(),
});
