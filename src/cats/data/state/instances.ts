import { Fix, URI, V } from '../../../core';
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

export type Variance = V<'S', '#'>;

export const stateFunctor: <S>() => Functor<
  [URI<StateURI, Fix<'S', S>>],
  Variance
> = () => Functor.of({ map_ });

export const stateApply: <S>() => Apply<
  [URI<StateURI, Fix<'S', S>>],
  Variance
> = () =>
  Apply.of({
    ...stateFunctor(),
    ap_: (ff, fa) => map2(ff, fa)((f, a) => f(a)),
    map2_: map2,
    product_: product_,
    productL_: productL_,
    productR_: productR_,
  });

export const stateApplicative: <S>() => Applicative<
  [URI<StateURI, Fix<'S', S>>],
  Variance
> = () =>
  Applicative.of({
    ...stateApply(),
    pure: pure,
  });

export const stateFlatMap: <S>() => FlatMap<
  [URI<StateURI, Fix<'S', S>>],
  Variance
> = () =>
  FlatMap.of({
    ...stateApply(),
    flatMap_: flatMap_,
    flatTap_: flatTap_,
    flatten: flatten,
  });

export const stateMonad: <S>() => Monad<
  [URI<StateURI, Fix<'S', S>>],
  Variance
> = () =>
  Monad.of({
    ...stateApplicative(),
    ...stateFlatMap(),
  });
