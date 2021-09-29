import { $, AnyK, Kind, TyK, _, α, λ } from '@cats4ts/core';
import { SemigroupK } from '../../semigroup-k';
import { MonoidK } from '../../monoid-k';
import { Functor } from '../../functor';
import { FunctorFilter } from '../../functor-filter';
import { Apply } from '../../apply';
import { Applicative } from '../../applicative';
import { Alternative } from '../../alternative';
import { ApplicativeError } from '../../applicative-error';
import { FlatMap } from '../../flat-map';
import { Monad } from '../../monad';
import { MonadError } from '../../monad-error';
import { Contravariant } from '../../contravariant';

import { Either } from '../either';

import { Kleisli as KleisliBase } from './algebra';
import { identity, liftF, pure, suspend, unit } from './constructors';
import { tailRecM } from './operators';
import {
  kleisliAlternative,
  kleisliApplicative,
  kleisliApplicativeError,
  kleisliApply,
  kleisliContravariant,
  kleisliFlatMap,
  kleisliFunctor,
  kleisliFunctorFilter,
  kleisliMonad,
  kleisliMonadError,
  kleisliMonoidK,
  kleisliSemigroupK,
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
  SemigroupK<F extends AnyK, A>(
    F: SemigroupK<F>,
  ): SemigroupK<$<KleisliK, [F, A]>>;
  MonoidK<F extends AnyK, A>(F: MonoidK<F>): MonoidK<$<KleisliK, [F, A]>>;
  Contravariant<F extends AnyK, B>(): Contravariant<
    λ<[α], $<KleisliK, [F, α, B]>>
  >;
  Functor<F extends AnyK, A>(F: Functor<F>): Functor<$<KleisliK, [F, A]>>;
  FunctorFilter<F extends AnyK, A>(
    F: FunctorFilter<F>,
  ): FunctorFilter<$<KleisliK, [F, A]>>;
  Apply<F extends AnyK, A>(F: FlatMap<F>): Apply<$<KleisliK, [F, A]>>;
  Applicative<F extends AnyK, A>(
    F: Applicative<F>,
  ): Applicative<$<KleisliK, [F, A]>>;
  Alternative<F extends AnyK, A>(
    F: Alternative<F>,
  ): Alternative<$<KleisliK, [F, A]>>;
  ApplicativeError<F extends AnyK, A, E>(
    F: ApplicativeError<F, E>,
  ): ApplicativeError<$<KleisliK, [F, A]>, E>;
  FlatMap<F extends AnyK, A>(F: Monad<F>): FlatMap<$<KleisliK, [F, A]>>;
  Monad<F extends AnyK, A>(F: Monad<F>): Monad<$<KleisliK, [F, A]>>;
  MonadError<F extends AnyK, A, E>(
    F: MonadError<F, E>,
  ): MonadError<$<KleisliK, [F, A]>, E>;
}

Kleisli.pure = pure;
Kleisli.liftF = liftF;
Kleisli.suspend = suspend;
Kleisli.unit = unit;
Kleisli.identity = identity;
Kleisli.tailRecM = tailRecM;

Kleisli.SemigroupK = kleisliSemigroupK;
Kleisli.MonoidK = kleisliMonoidK;
Kleisli.Functor = kleisliFunctor;
Kleisli.FunctorFilter = kleisliFunctorFilter;
Kleisli.Contravariant = kleisliContravariant;
Kleisli.Apply = kleisliApply;
Kleisli.Applicative = kleisliApplicative;
Kleisli.Alternative = kleisliAlternative;
Kleisli.ApplicativeError = kleisliApplicativeError;
Kleisli.FlatMap = kleisliFlatMap;
Kleisli.Monad = kleisliMonad;
Kleisli.MonadError = kleisliMonadError;

// -- HKT

export const KleisliURI = 'cats/data/kleisli';
export type KleisliURI = typeof KleisliURI;
export type KleisliK = TyK<KleisliURI, [_, _, _]>;

declare module '@cats4ts/core/lib/hkt/hkt' {
  interface URItoKind<Tys extends unknown[]> {
    [KleisliURI]: Tys[0] extends AnyK ? Kleisli<Tys[0], Tys[1], Tys[2]> : any;
  }
}
