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
import { Reader } from './algebra';

export const readerFunctor2C: <R>() => Functor2C<URI, R> = () =>
  Functor2C.of({ URI, map_ });

export const readerFunctor2: Lazy<Functor2<URI>> = () =>
  Functor2.of({ URI, map_ });

export const readerApply2C: <R>() => Apply2C<URI, R> = <R>() =>
  Apply2C.of<URI, R>({
    ...readerFunctor2C<R>(),
    ap_: ap_,
    map2_:
      <A, B>(fa: Reader<R, A>, fb: Reader<R, B>) =>
      <C>(f: (a: A, b: B) => C) =>
        map2_<R, R, A, B, C>(fa, fb, f),
    product_: product_,
    productL_: productL_,
    productR_: productR_,
  });

export const readerApply2: Lazy<Apply2<URI>> = () =>
  Apply2.of({
    ...readerFunctor2C(),
    ap_: ap_,
    map2_:
      <E, A, B>(fa: Reader<E, A>, fb: Reader<E, B>) =>
      <C>(f: (a: A, b: B) => C) =>
        map2_<E, E, A, B, C>(fa, fb, f),
    product_: product_,
    productL_: productL_,
    productR_: productR_,
  });

export const readerApplicative2C: <R>() => Applicative2C<URI, R> = () =>
  Applicative2C.of({
    ...readerApply2C(),
    pure: pure,
    unit: unit,
  });

export const readerApplicative2: Lazy<Applicative2<URI>> = () =>
  Applicative2C.of({
    ...readerApply2(),
    pure: pure,
    unit: unit,
  });

export const readerFlatMap2C: <R>() => FlatMap2C<URI, R> = () =>
  FlatMap2C.of({
    ...readerApply2C(),
    flatMap_: flatMap_,
    flatTap_: flatTap_,
    flatten: flatten,
  });

export const readerFlatMap2: Lazy<FlatMap2<URI>> = () =>
  FlatMap2.of({
    ...readerApply2(),
    flatMap_: flatMap_,
    flatTap_: flatTap_,
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
