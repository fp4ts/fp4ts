import { $, lazyVal } from '@fp4ts/core';
import { Functor } from '../../functor';
import { Applicative } from '../../applicative';
import { Apply } from '../../apply';
import { FlatMap } from '../../flat-map';
import { Monad } from '../../monad';

import { StateK } from './state';
import {
  flatMap_,
  flatTap_,
  flatten,
  map2,
  map_,
  productL_,
  productR_,
  product_,
  tailRecM_,
} from './operators';
import { pure } from './constructors';

export const stateFunctor: <S>() => Functor<$<StateK, [S]>> = lazyVal(() =>
  Functor.of({ map_ }),
);

export const stateApply: <S>() => Apply<$<StateK, [S]>> = lazyVal(() =>
  Apply.of({
    ...stateFunctor(),
    ap_: (ff, fa) => map2(ff, fa)((f, a) => f(a)),
    map2_: map2,
    product_: product_,
    productL_: productL_,
    productR_: productR_,
  }),
);

export const stateApplicative: <S>() => Applicative<$<StateK, [S]>> = lazyVal(
  () =>
    Applicative.of({
      ...stateApply(),
      pure: pure,
    }),
);

export const stateFlatMap: <S>() => FlatMap<$<StateK, [S]>> = lazyVal(() =>
  FlatMap.of({
    ...stateApply(),
    flatMap_: flatMap_,
    flatTap_: flatTap_,
    flatten: flatten,
    tailRecM_: tailRecM_,
  }),
);

export const stateMonad: <S>() => Monad<$<StateK, [S]>> = lazyVal(() =>
  Monad.of({
    ...stateApplicative(),
    ...stateFlatMap(),
  }),
);
