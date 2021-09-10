import { Lazy, URI } from '../../../core';
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
} from './operators';
import { ReaderURI } from './reader';
import { pure, unit } from './constructors';
import { Reader } from './algebra';

export const readerFunctor: Lazy<Functor<[URI<ReaderURI>]>> = () =>
  Functor.of({ map_ });

export const readerApply: Lazy<Apply<[URI<ReaderURI>]>> = () =>
  Apply.of({
    ...readerFunctor(),
    ap_: ap_,
    map2_:
      <R, A, B>(fa: Reader<R, A>, fb: Reader<R, B>) =>
      <C>(f: (a: A, b: B) => C) =>
        map2_<R, R, A, B, C>(fa, fb, f),
    product_: product_,
    productL_: productL_,
    productR_: productR_,
  });

export const readerApplicative: Lazy<Applicative<[URI<ReaderURI>]>> = () =>
  Applicative.of({
    ...readerApply(),
    pure: pure,
    unit: () => unit,
  });

export const readerFlatMap: Lazy<FlatMap<[URI<ReaderURI>]>> = () =>
  FlatMap.of({
    ...readerApply(),
    flatMap_: flatMap_,
    flatTap_: flatTap_,
    flatten: flatten,
  });

export const readerMonad: Lazy<Monad<[URI<ReaderURI>]>> = () =>
  Monad.of({
    ...readerApplicative(),
    ...readerFlatMap(),
  });
