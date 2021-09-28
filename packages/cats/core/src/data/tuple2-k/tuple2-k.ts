import { $, AnyK, Kind, TyK, _ } from '@cats4ts/core';
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

export type Tuple2K<F extends AnyK, G extends AnyK, A> = [
  Kind<F, [A]>,
  Kind<G, [A]>,
];

export const Tuple2K: Tuple2KObj = function <F extends AnyK, G extends AnyK, A>(
  fst: Kind<F, [A]>,
  snd: Kind<G, [A]>,
): Tuple2K<F, G, A> {
  return [fst, snd];
};

interface Tuple2KObj {
  <F extends AnyK, G extends AnyK, A>(
    fst: Kind<F, [A]>,
    snd: Kind<G, [A]>,
  ): Tuple2K<F, G, A>;
  liftK<F extends AnyK, G extends AnyK, A>(
    fst: Kind<F, [A]>,
    snd: Kind<G, [A]>,
  ): Tuple2K<F, G, A>;

  // -- Instances

  Eq<F extends AnyK, G extends AnyK, A>(
    EF: Eq<Kind<F, [A]>>,
    EG: Eq<Kind<G, [A]>>,
  ): Eq<Tuple2K<F, G, A>>;
  Functor<F extends AnyK, G extends AnyK>(
    F: Functor<F>,
    G: Functor<G>,
  ): Functor<$<Tuple2kK, [F, G]>>;
  Apply<F extends AnyK, G extends AnyK>(
    F: Apply<F>,
    G: Apply<G>,
  ): Apply<$<Tuple2kK, [F, G]>>;
  Applicative<F extends AnyK, G extends AnyK>(
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

const Tuple2kURI = '@cats4ts/cats/core/data/tuple2-k';
type Tuple2kURI = typeof Tuple2kURI;
export type Tuple2kK = TyK<Tuple2kURI, [_, _, _]>;

declare module '@cats4ts/core/lib/hkt/hkt' {
  interface URItoKind<Tys extends unknown[]> {
    [Tuple2kURI]: Tys[0] extends AnyK
      ? Tys[1] extends AnyK
        ? Tuple2K<Tys[0], Tys[1], Tys[2]>
        : any
      : any;
  }
}
