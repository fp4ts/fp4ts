// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, Fix, Kind, TyK, TyVar, α, λ } from '@fp4ts/core';
import { Defer } from '../../defer';
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
  kleisliDefer,
  kleisliFlatMap,
  kleisliFunctor,
  kleisliFunctorFilter,
  kleisliMonad,
  kleisliMonadError,
  kleisliMonoidK,
  kleisliSemigroupK,
} from './instances';

export type Kleisli<F, A, B> = KleisliBase<F, A, B>;

export const Kleisli: KleisliObj = function (f) {
  return suspend(f);
};

interface KleisliObj {
  <F, A, B>(f: (a: A) => Kind<F, [B]>): Kleisli<F, A, B>;

  pure<F>(F: Applicative<F>): <B>(x: B) => Kleisli<F, unknown, B>;

  liftF<F, B>(fb: Kind<F, [B]>): Kleisli<F, unknown, B>;

  suspend<F, A, B>(f: (a: A) => Kind<F, [B]>): Kleisli<F, A, B>;

  unit<F>(F: Applicative<F>): Kleisli<F, unknown, void>;

  identity<F, A>(F: Applicative<F>): Kleisli<F, A, A>;

  tailRecM<F>(
    F: Monad<F>,
  ): <A>(
    a: A,
  ) => <B, C>(f: (a: A) => Kleisli<F, B, Either<A, C>>) => Kleisli<F, B, C>;

  // -- Instances
  Defer<F, A>(F: Defer<F>): Defer<$<KleisliK, [F, A]>>;
  SemigroupK<F, A>(F: SemigroupK<F>): SemigroupK<$<KleisliK, [F, A]>>;
  MonoidK<F, A>(F: MonoidK<F>): MonoidK<$<KleisliK, [F, A]>>;
  Contravariant<F, B>(): Contravariant<λ<KleisliK, [Fix<F>, α, Fix<B>]>>;
  Functor<F, A>(F: Functor<F>): Functor<$<KleisliK, [F, A]>>;
  FunctorFilter<F, A>(F: FunctorFilter<F>): FunctorFilter<$<KleisliK, [F, A]>>;
  Apply<F, A>(F: FlatMap<F>): Apply<$<KleisliK, [F, A]>>;
  Applicative<F, A>(F: Applicative<F>): Applicative<$<KleisliK, [F, A]>>;
  Alternative<F, A>(F: Alternative<F>): Alternative<$<KleisliK, [F, A]>>;
  ApplicativeError<F, A, E>(
    F: ApplicativeError<F, E>,
  ): ApplicativeError<$<KleisliK, [F, A]>, E>;
  FlatMap<F, A>(F: Monad<F>): FlatMap<$<KleisliK, [F, A]>>;
  Monad<F, A>(F: Monad<F>): Monad<$<KleisliK, [F, A]>>;
  MonadError<F, A, E>(F: MonadError<F, E>): MonadError<$<KleisliK, [F, A]>, E>;
}

Kleisli.pure = pure;
Kleisli.liftF = liftF;
Kleisli.suspend = suspend;
Kleisli.unit = unit;
Kleisli.identity = identity;
Kleisli.tailRecM = tailRecM;

Kleisli.Defer = kleisliDefer;
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

/**
 * @category Type Constructor
 * @category Data
 */
export interface KleisliK extends TyK<[unknown, unknown, unknown]> {
  [$type]: Kleisli<TyVar<this, 0>, TyVar<this, 1>, TyVar<this, 2>>;
}
