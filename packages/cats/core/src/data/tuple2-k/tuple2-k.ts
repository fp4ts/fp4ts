import { $, $type, Kind, TyK, TyVar } from '@cats4ts/core';
import { Eq } from '../../eq';
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
  Functor<F, G>(F: Functor<F>, G: Functor<G>): Functor<$<Tuple2kK, [F, G]>>;
  Apply<F, G>(F: Apply<F>, G: Apply<G>): Apply<$<Tuple2kK, [F, G]>>;
  Applicative<F, G>(
    F: Applicative<F>,
    G: Applicative<G>,
  ): Applicative<$<Tuple2kK, [F, G]>>;
}

Tuple2K.Eq = tuple2KEq;
Tuple2K.liftK = liftK;
Tuple2K.Functor = tuple2KFunctor;
Tuple2K.Apply = tuple2KApply;
Tuple2K.Applicative = tuple2KApplicative;

// -- HKT

export interface Tuple2kK extends TyK<[unknown, unknown, unknown]> {
  [$type]: Tuple2K<TyVar<this, 0>, TyVar<this, 1>, TyVar<this, 2>>;
}
