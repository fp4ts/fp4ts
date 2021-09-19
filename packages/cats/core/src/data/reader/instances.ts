import { $ } from '@cats4ts/core';

import {
  Applicative,
  Apply,
  FlatMap,
  Functor,
  Monad,
} from '@cats4ts/cats-core';

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
  tailRecM_,
} from './operators';
import { ReaderK } from './reader';
import { pure, unit } from './constructors';

export const readerFunctor: <R>() => Functor<$<ReaderK, [R]>> = () =>
  Functor.of({ map_ });

export const readerApply: <R>() => Apply<$<ReaderK, [R]>> = () =>
  Apply.of({
    ...readerFunctor(),
    ap_: ap_,
    map2_: map2_,
    product_: product_,
    productL_: productL_,
    productR_: productR_,
  });

export const readerApplicative: <R>() => Applicative<$<ReaderK, [R]>> = () =>
  Applicative.of({
    ...readerApply(),
    pure: pure,
    unit,
  });

export const readerFlatMap: <R>() => FlatMap<$<ReaderK, [R]>> = () =>
  FlatMap.of({
    ...readerApply(),
    flatMap_: flatMap_,
    flatTap_: flatTap_,
    flatten: flatten,
    tailRecM_: tailRecM_,
  });

export const readerMonad: <R>() => Monad<$<ReaderK, [R]>> = () =>
  Monad.of({
    ...readerApplicative(),
    ...readerFlatMap(),
  });
