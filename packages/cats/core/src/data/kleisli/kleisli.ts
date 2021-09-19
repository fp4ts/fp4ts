import { $, AnyK, Kind, TyK, _ } from '@cats4ts/core';
import {
  Apply,
  Applicative,
  Functor,
  FlatMap,
  Monad,
} from '@cats4ts/cats-core';

import { Either } from '../either';

import { Kleisli as KleisliBase } from './algebra';
import { identity, liftF, pure, suspend, unit } from './constructors';
import { tailRecM } from './operators';
import {
  kleisliApplicative,
  kleisliApply,
  kleisliFlatMap,
  kleisliFunctor,
  kleisliMonad,
} from './instances';

export type Kleisli<F extends AnyK, A, B> = KleisliBase<F, A, B>;

export const Kleisli: KleisliObj = function (f) {
  return suspend(f);
};

interface KleisliObj {
  <F extends AnyK, A, B>(f: (a: A) => Kind<F, [B]>): Kleisli<F, A, B>;

  pure<F extends AnyK>(F: Applicative<F>): <B>(x: B) => Kleisli<F, unknown, B>;

  liftF<F extends AnyK, B>(fb: Kind<F, [B]>): Kleisli<F, unknown, B>;

  suspend<F extends AnyK, A, B>(f: (a: A) => Kind<F, [B]>): Kleisli<F, A, B>;

  unit<F extends AnyK>(F: Applicative<F>): Kleisli<F, unknown, void>;

  identity<F extends AnyK, A>(F: Applicative<F>): Kleisli<F, A, A>;

  tailRecM<F extends AnyK>(
    F: Monad<F>,
  ): <A>(
    a: A,
  ) => <B, C>(f: (a: A) => Kleisli<F, B, Either<A, C>>) => Kleisli<F, B, C>;

  // -- Instances
  Functor<F extends AnyK, A>(F: Functor<F>): Functor<$<KleisliK, [F, A]>>;
  Apply<F extends AnyK, A>(F: FlatMap<F>): Apply<$<KleisliK, [F, A]>>;
  Applicative<F extends AnyK, A>(
    F: Applicative<F>,
  ): Applicative<$<KleisliK, [F, A]>>;
  FlatMap<F extends AnyK, A>(F: Monad<F>): FlatMap<$<KleisliK, [F, A]>>;
  Monad<F extends AnyK, A>(F: Monad<F>): Monad<$<KleisliK, [F, A]>>;
}

Kleisli.pure = pure;
Kleisli.liftF = liftF;
Kleisli.suspend = suspend;
Kleisli.unit = unit;
Kleisli.identity = identity;
Kleisli.tailRecM = tailRecM;

Kleisli.Functor = kleisliFunctor;
Kleisli.Apply = kleisliApply;
Kleisli.Applicative = kleisliApplicative;
Kleisli.FlatMap = kleisliFlatMap;
Kleisli.Monad = kleisliMonad;

// -- HKT

export const KleisliURI = 'cats/data/kleisli';
export type KleisliURI = typeof KleisliURI;
export type KleisliK = TyK<KleisliURI, [_, _, _]>;

declare module '@cats4ts/core/lib/hkt/hkt' {
  interface URItoKind<Tys extends unknown[]> {
    [KleisliURI]: Tys[0] extends AnyK ? Kleisli<Tys[0], Tys[1], Tys[2]> : any;
  }
}
