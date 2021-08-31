import { Lazy } from '../../../fp/core';
import { Apply } from '../../apply';
import { Applicative } from '../../applicative';
import { Functor } from '../../functor';
import { FlatMap } from '../../flat-map';
import { Monad } from '../../monad';
import {
  flatMap,
  flatMap_,
  flatTap,
  flatten,
  map,
  map_,
  tap,
} from './operators';
import { URI } from './option';
import { pure } from './constructors';

export const optionFunctor: Lazy<Functor<URI>> = () => ({
  URI: URI,
  map: map,
  tap: tap,
});

export const optionApply: Lazy<Apply<URI>> = () => ({
  ...optionFunctor(),
  ap: ff => fa => flatMap_(ff, f => map_(fa, a => f(a))),
  map2: (fa, fb) => f => flatMap_(fa, a => map_(fb, b => f(a, b))),
  product: (fa, fb) => flatMap_(fa, a => map_(fb, b => [a, b])),
  productL: (fa, fb) => flatMap_(fa, a => map_(fb, () => a)),
  productR: (fa, fb) => flatMap_(fa, () => map_(fb, b => b)),
});

export const optionApplicative: Lazy<Applicative<URI>> = () => ({
  ...optionApply(),
  pure: pure,
  unit: pure(undefined),
});

export const optionFlatMap: Lazy<FlatMap<URI>> = () => ({
  ...optionApply(),
  flatMap: flatMap,
  flatTap: flatTap,
  flatten: flatten,
});

export const optionMonad: Lazy<Monad<URI>> = () => ({
  ...optionApplicative(),
  ...optionFlatMap(),
});
