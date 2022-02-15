// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, Kind, TyK, TyVar } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Functor } from '../../functor';
import { Apply } from '../../apply';
import { Applicative } from '../../applicative';

import { liftK } from './constructors';
import {
  tuple2KApplicative,
  tuple2KApply,
  tuple2KEq,
  tuple2KFunctor,
} from './instances';

export type Tuple2K<F, G, A> = [Kind<F, [A]>, Kind<G, [A]>];

export const Tuple2K: Tuple2KObj = function <F, G, A>(
  fst: Kind<F, [A]>,
  snd: Kind<G, [A]>,
): Tuple2K<F, G, A> {
  return [fst, snd];
};

interface Tuple2KObj {
  <F, G, A>(fst: Kind<F, [A]>, snd: Kind<G, [A]>): Tuple2K<F, G, A>;
  liftK<F, G, A>(fst: Kind<F, [A]>, snd: Kind<G, [A]>): Tuple2K<F, G, A>;

  // -- Instances

  Eq<F, G, A>(EF: Eq<Kind<F, [A]>>, EG: Eq<Kind<G, [A]>>): Eq<Tuple2K<F, G, A>>;
  Functor<F, G>(F: Functor<F>, G: Functor<G>): Functor<$<Tuple2KF, [F, G]>>;
  Apply<F, G>(F: Apply<F>, G: Apply<G>): Apply<$<Tuple2KF, [F, G]>>;
  Applicative<F, G>(
    F: Applicative<F>,
    G: Applicative<G>,
  ): Applicative<$<Tuple2KF, [F, G]>>;
}

Tuple2K.Eq = tuple2KEq;
Tuple2K.liftK = liftK;
Tuple2K.Functor = tuple2KFunctor;
Tuple2K.Apply = tuple2KApply;
Tuple2K.Applicative = tuple2KApplicative;

// -- HKT

/**
 * @category Type Constructor
 * @category Data
 */
export interface Tuple2KF extends TyK<[unknown, unknown, unknown]> {
  [$type]: Tuple2K<TyVar<this, 0>, TyVar<this, 1>, TyVar<this, 2>>;
}
