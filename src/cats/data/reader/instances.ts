/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { URI, V } from '../../../core';
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
  map2,
  map2_,
  map_,
  productL_,
  productR_,
  product_,
} from './operators';
import { ReaderURI } from './reader';
import { pure, unit } from './constructors';

type Variance = V<'R', '-'> & V<'A', '+'>;

export const readerFunctor = () =>
  Functor.of<[URI<ReaderURI, Variance>], Variance>({ map_ });

export const readerApply = () =>
  Apply.of<[URI<ReaderURI, Variance>], Variance>({
    ...readerFunctor(),
    ap_: ap_,
    map2_: map2_,
    product_: product_,
    productL_: productL_,
    productR_: productR_,
  });

export const readerApplicative = () =>
  Applicative.of<[URI<ReaderURI, Variance>], Variance>({
    ...readerApply(),
    pure: pure,
    unit: () => unit,
  });

export const readerFlatMap = () =>
  FlatMap.of<[URI<ReaderURI, Variance>], Variance>({
    ...readerApply(),
    flatMap_: flatMap_,
    flatTap_: flatTap_,
    flatten: flatten,
  });

export const readerMonad = () =>
  Monad.of<[URI<ReaderURI, Variance>], Variance>({
    ...readerApplicative(),
    ...readerFlatMap(),
  });
