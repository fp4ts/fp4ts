import { Lazy, URI, V } from '../../../core';
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

export type Variance = V<'S', '#'> & V<'A', '+'>;

export const stateFunctor: Lazy<Functor<[URI<StateURI, Variance>], Variance>> =
  () => Functor.of({ map_ });

export const stateApply: Lazy<Apply<[URI<StateURI, Variance>], Variance>> =
  () =>
    Apply.of({
      ...stateFunctor(),
      ap_: (ff, fa) => map2(ff, fa)((f, a) => f(a)),
      map2_: map2,
      product_: product_,
      productL_: productL_,
      productR_: productR_,
    });

export const stateApplicative: Lazy<
  Applicative<[URI<StateURI, Variance>], Variance>
> = () =>
  Applicative.of({
    ...stateApply(),
    pure: pure,
  });

export const stateFlatMap: Lazy<FlatMap<[URI<StateURI, Variance>], Variance>> =
  () =>
    FlatMap.of({
      ...stateApply(),
      flatMap_: flatMap_,
      flatTap_: flatTap_,
      flatten: flatten,
    });

export const stateMonad: Lazy<Monad<[URI<StateURI, Variance>], Variance>> =
  () =>
    Monad.of({
      ...stateApplicative(),
      ...stateFlatMap(),
    });
