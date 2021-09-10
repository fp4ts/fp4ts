import { Lazy, URI } from '../../../core';
import { Functor } from '../../functor';
import { Applicative } from '../../applicative';
import { Apply } from '../../apply';
import { FlatMap } from '../../flat-map';
import { Monad } from '../../monad';

import { StateURI } from './state';
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

export const stateFunctor: Lazy<Functor<[URI<StateURI>]>> = () =>
  Functor.of({ map_ });

export const stateApply: Lazy<Apply<[URI<StateURI>]>> = () =>
  Apply.of({
    ...stateFunctor(),
    ap_: (ff, fa) => map2(ff, fa)((f, a) => f(a)),
    map2_: map2,
    product_: product_,
    productL_: productL_,
    productR_: productR_,
  });

export const stateApplicative: Lazy<Applicative<[URI<StateURI>]>> = () =>
  Applicative.of({
    ...stateApply(),
    pure: pure,
  });

export const stateFlatMap: Lazy<FlatMap<[URI<StateURI>]>> = () =>
  FlatMap.of({
    ...stateApply(),
    flatMap_: flatMap_,
    flatTap_: flatTap_,
    flatten: flatten,
  });

export const stateMonad: Lazy<Monad<[URI<StateURI>]>> = () =>
  Monad.of({
    ...stateApplicative(),
    ...stateFlatMap(),
  });
