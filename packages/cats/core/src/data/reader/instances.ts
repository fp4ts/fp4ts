// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, lazyVal } from '@fp4ts/core';
import { Applicative } from '../../applicative';
import { Apply } from '../../apply';
import { FlatMap } from '../../flat-map';
import { Functor } from '../../functor';
import { Monad } from '../../monad';

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

export const readerFunctor: <R>() => Functor<$<ReaderK, [R]>> = lazyVal(() =>
  Functor.of({ map_ }),
);

export const readerApply: <R>() => Apply<$<ReaderK, [R]>> = lazyVal(() =>
  Apply.of({
    ...readerFunctor(),
    ap_: ap_,
    map2_: map2_,
    product_: product_,
    productL_: productL_,
    productR_: productR_,
  }),
);

export const readerApplicative: <R>() => Applicative<$<ReaderK, [R]>> = lazyVal(
  () =>
    Applicative.of({
      ...readerApply(),
      pure: pure,
      unit,
    }),
);

export const readerFlatMap: <R>() => FlatMap<$<ReaderK, [R]>> = lazyVal(() =>
  FlatMap.of({
    ...readerApply(),
    flatMap_: flatMap_,
    flatTap_: flatTap_,
    flatten: flatten,
    tailRecM_: tailRecM_,
  }),
);

export const readerMonad: <R>() => Monad<$<ReaderK, [R]>> = lazyVal(() =>
  Monad.of({
    ...readerApplicative(),
    ...readerFlatMap(),
  }),
);
