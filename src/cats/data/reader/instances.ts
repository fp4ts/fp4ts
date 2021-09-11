/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Lazy, URI, V } from '../../../core';
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

export type Variance = V<'R', '-'> & V<'A', '+'>;

export const readerFunctor: Lazy<
  Functor<[URI<ReaderURI, Variance>], Variance>
> = () => Functor.of({ map_ });

export const readerApply: Lazy<Apply<[URI<ReaderURI, Variance>], Variance>> =
  () =>
    Apply.of({
      ...readerFunctor(),
      ap_: ap_,
      map2_: map2_,
      product_: product_,
      productL_: productL_,
      productR_: productR_,
    });

export const readerApplicative: Lazy<
  Applicative<[URI<ReaderURI, Variance>], Variance>
> = () =>
  Applicative.of({
    ...readerApply(),
    pure: pure,
    unit: () => unit,
  });

export const readerFlatMap: Lazy<
  FlatMap<[URI<ReaderURI, Variance>], Variance>
> = () =>
  FlatMap.of({
    ...readerApply(),
    flatMap_: flatMap_,
    flatTap_: flatTap_,
    flatten: flatten,
  });

export const readerMonad: Lazy<Monad<[URI<ReaderURI, Variance>], Variance>> =
  () =>
    Monad.of({
      ...readerApplicative(),
      ...readerFlatMap(),
    });
