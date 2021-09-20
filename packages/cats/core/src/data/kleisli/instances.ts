import { $, AnyK } from '@cats4ts/core';
import { Apply } from '../../apply';
import { Applicative } from '../../applicative';
import { Functor } from '../../functor';
import { FlatMap } from '../../flat-map';
import { Monad } from '../../monad';

import { KleisliK } from './kleisli';
import {
  ap_,
  flatMap_,
  map2_,
  map_,
  productL_,
  productR_,
  product_,
  tailRecM_,
} from './operators';
import { pure } from './constructors';

export const kleisliFunctor: <F extends AnyK, A>(
  F: Functor<F>,
) => Functor<$<KleisliK, [F, A]>> = F =>
  Functor.of({
    map_: map_(F),
  });

export const kleisliApply: <F extends AnyK, A>(
  F: FlatMap<F>,
) => Apply<$<KleisliK, [F, A]>> = F =>
  Apply.of({
    ...kleisliFunctor(F),
    ap_: ap_(F),
    map2_: map2_(F),
    product_: product_(F),
    productL_: productL_(F),
    productR_: productR_(F),
  });

export const kleisliApplicative: <F extends AnyK, A>(
  F: Applicative<F>,
) => Applicative<$<KleisliK, [F, A]>> = F =>
  Applicative.of({
    ...kleisliFunctor(F),
    ...kleisliApplicative(F),
    pure: pure(F),
  });

export const kleisliFlatMap: <F extends AnyK, A>(
  F: Monad<F>,
) => FlatMap<$<KleisliK, [F, A]>> = F =>
  FlatMap.of({
    ...kleisliApply(F),
    flatMap_: flatMap_(F),
    tailRecM_: tailRecM_(F),
  });

export const kleisliMonad: <F extends AnyK, A>(
  F: Monad<F>,
) => Monad<$<KleisliK, [F, A]>> = F =>
  Monad.of({
    ...kleisliApplicative(F),
    ...kleisliFlatMap(F),
  });
