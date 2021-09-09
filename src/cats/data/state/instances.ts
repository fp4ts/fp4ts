import { Lazy } from '../../../fp/core';
import { Functor2, Functor2C } from '../../functor';
import { Applicative2, Applicative2C } from '../../applicative';
import { Apply2, Apply2C } from '../../apply';
import { FlatMap2, FlatMap2C } from '../../flat-map';
import { Monad2, Monad2C } from '../../monad';

import { URI } from './state';
import {
  flatMap_,
  flatTap_,
  flatten,
  map2,
  map_,
  productL_,
  productR_,
  product_,
} from './operators';
import { pure } from './constructors';

export const stateFunctor2C: <S>() => Functor2C<URI, S> = () =>
  Functor2C.of({ URI, map_ });

export const stateFunctor2: Lazy<Functor2<URI>> = () =>
  Functor2.of({ URI, map_ });

export const stateApply2C: <S>() => Apply2C<URI, S> = () =>
  Apply2C.of({
    ...stateFunctor2C(),
    ap_: (ff, fa) => map2(ff, fa)((f, a) => f(a)),
    map2_: map2,
    product_: product_,
    productL_: productL_,
    productR_: productR_,
  });

export const stateApply2: Lazy<Apply2<URI>> = () =>
  Apply2.of({
    ...stateFunctor2(),
    ap_: (ff, fa) => map2(ff, fa)((f, a) => f(a)),
    map2_: map2,
    product_: product_,
    productL_: productL_,
    productR_: productR_,
  });

export const stateApplicative2C: <S>() => Applicative2C<URI, S> = () =>
  Applicative2C.of({
    ...stateApply2C(),
    pure: pure,
  });

export const stateApplicative2: Lazy<Applicative2<URI>> = () =>
  Applicative2.of({
    ...stateApply2(),
    pure: pure,
  });

export const stateFlatMap2C: <S>() => FlatMap2C<URI, S> = () =>
  FlatMap2C.of({
    ...stateApply2C(),
    flatMap_: flatMap_,
    flatTap_: flatTap_,
    flatten: flatten,
  });

export const stateFlatMap2: Lazy<FlatMap2<URI>> = () =>
  FlatMap2.of({
    ...stateApply2(),
    flatMap_: flatMap_,
    flatTap_: flatTap_,
    flatten: flatten,
  });

export const stateMonad2C: <S>() => Monad2C<URI, S> = () => ({
  ...stateApplicative2C(),
  ...stateFlatMap2C(),
});

export const stateMonad2: Lazy<Monad2<URI>> = () => ({
  ...stateApplicative2(),
  ...stateFlatMap2(),
});
