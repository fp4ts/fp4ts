import { Lazy } from '../../../fp/core';
import { Applicative2, Applicative2C } from '../../applicative';
import { Apply2, Apply2C } from '../../apply';
import { FlatMap2, FlatMap2C } from '../../flat-map';
import { Functor2, Functor2C } from '../../functor';
import { Monad2, Monad2C } from '../../monad';

import {
  ap_,
  flatMap_,
  flatTap_,
  flatten,
  map2_,
  map_,
  productL_,
  productR_,
  product_,
} from './operators';
import { URI } from './reader';
import { pure, unit } from './constructors';

export const readerFunctor2C: <R>() => Functor2C<URI, R> = () =>
  Functor2C.of({ URI, map_ });

export const readerFunctor2: Lazy<Functor2<URI>> = () =>
  Functor2.of({ URI, map_ });

export const readerApply2C: <R>() => Apply2C<URI, R> = () => ({
  ...readerFunctor2C(),
  ap: ff => fa => ap_(ff, fa),
  map2: (fa, fb) => f => map2_(fa, fb, f),
  product: product_,
  productL: productL_,
  productR: productR_,
});

export const readerApply2: Lazy<Apply2<URI>> = () => ({
  ...readerFunctor2C(),
  ap: ff => fa => ap_(ff, fa),
  map2: (fa, fb) => f => map2_(fa, fb, f),
  product: product_,
  productL: productL_,
  productR: productR_,
});

export const readerApplicative2C: <R>() => Applicative2C<URI, R> = () => ({
  ...readerApply2C(),
  pure: pure,
  unit: unit,
});

export const readerApplicative2: Lazy<Applicative2<URI>> = () => ({
  ...readerApply2(),
  pure: pure,
  unit: unit,
});

export const readerFlatMap2C: <R>() => FlatMap2C<URI, R> = () => ({
  ...readerApply2C(),
  flatMap: f => fa => flatMap_(fa, f),
  flatTap: f => fa => flatTap_(fa, f),
  flatten: flatten,
});

export const readerFlatMap2: Lazy<FlatMap2<URI>> = () => ({
  ...readerApply2(),
  flatMap: f => fa => flatMap_(fa, f),
  flatTap: f => fa => flatTap_(fa, f),
  flatten: flatten,
});

export const readerMonad2C: <R>() => Monad2C<URI, R> = () => ({
  ...readerApplicative2C(),
  ...readerFlatMap2C(),
});

export const readerMonad2: Lazy<Monad2<URI>> = () => ({
  ...readerApplicative2(),
  ...readerFlatMap2(),
});
