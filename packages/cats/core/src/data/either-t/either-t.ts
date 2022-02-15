// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, Kind, TyK, TyVar } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Functor } from '../../functor';
import { Bifunctor } from '../../bifunctor';
import { Applicative } from '../../applicative';
import { Monad } from '../../monad';
import { MonadError } from '../../monad-error';
import { SemigroupK } from '../../semigroup-k';

import { Either } from '../either';
import { Option } from '../option';
import { OptionT } from '../option-t';

import { EitherT as EitherTBase } from './algebra';
import {
  fromEither,
  fromOption,
  fromOptionT,
  left,
  leftT,
  liftF,
  pure,
  right,
  rightT,
  rightUnit,
  tailRecM,
  tailRecM_,
} from './constructors';
import {
  eitherTBifunctor,
  eitherTEq,
  eitherTFunctor,
  eitherTMonad,
  eitherTMonadError,
  eitherTSemigroupK,
} from './instances';

export type EitherT<F, A, B> = EitherTBase<F, A, B>;

export const EitherT: EitherTObj = function (fab) {
  return new EitherTBase(fab);
};

interface EitherTObj {
  <F, A, B>(fab: Kind<F, [Either<A, B>]>): EitherT<F, A, B>;
  right<F>(F: Applicative<F>): <B, A = never>(x: B) => EitherT<F, A, B>;
  pure<F>(F: Applicative<F>): <B, A = never>(x: B) => EitherT<F, A, B>;
  rightUnit<F, A = never>(F: Applicative<F>): EitherT<F, A, void>;
  left<F>(F: Applicative<F>): <A, B = never>(x: A) => EitherT<F, A, B>;
  rightT<F>(
    F: Functor<F>,
  ): <B, A = never>(fb: Kind<F, [B]>) => EitherT<F, A, B>;
  leftT<F>(F: Functor<F>): <A, B = never>(fa: Kind<F, [A]>) => EitherT<F, A, B>;
  liftF<F>(
    F: Applicative<F>,
  ): <B, A = never>(x: Kind<F, [B]>) => EitherT<F, A, B>;
  fromEither<F>(
    F: Applicative<F>,
  ): <A, B>(ab: Either<A, B>) => EitherT<F, A, B>;
  fromOption<F>(
    F: Applicative<F>,
  ): <A, B>(fb: Option<B>, ifNone: () => A) => EitherT<F, A, B>;
  fromOptionT<F>(
    F: Functor<F>,
  ): <A, B>(fa: OptionT<F, B>, ifNone: () => A) => EitherT<F, A, B>;
  tailRecM<F>(
    F: Monad<F>,
  ): <S>(
    s0: S,
  ) => <A, B>(f: (s: S) => EitherT<F, A, Either<S, B>>) => EitherT<F, A, B>;
  tailRecM_<F>(
    F: Monad<F>,
  ): <S, A, B>(
    s0: S,
    f: (s: S) => EitherT<F, A, Either<S, B>>,
  ) => EitherT<F, A, B>;

  // -- Instances

  Eq<F, AA, B>(E: Eq<Kind<F, [Either<AA, B>]>>): Eq<EitherT<F, AA, B>>;
  SemigroupK<F, AA>(F: Monad<F>): SemigroupK<$<EitherTF, [F, AA]>>;
  Functor<F, AA>(F: Functor<F>): Functor<$<EitherTF, [F, AA]>>;
  Bifunctor<F>(F: Functor<F>): Bifunctor<$<EitherTF, [F]>>;
  Monad<F, AA>(F: Monad<F>): Monad<$<EitherTF, [F, AA]>>;
  MonadError<F, E>(F: Monad<F>): MonadError<$<EitherTF, [F, E]>, E>;
}

EitherT.right = right;
EitherT.pure = pure;
EitherT.rightUnit = rightUnit;
EitherT.left = left;
EitherT.rightT = rightT;
EitherT.leftT = leftT;
EitherT.liftF = liftF;
EitherT.fromEither = fromEither;
EitherT.fromOption = fromOption;
EitherT.fromOptionT = fromOptionT;
EitherT.tailRecM = tailRecM;
EitherT.tailRecM_ = tailRecM_;

EitherT.Eq = eitherTEq;
EitherT.SemigroupK = eitherTSemigroupK;
EitherT.Functor = eitherTFunctor;
EitherT.Bifunctor = eitherTBifunctor;
EitherT.Monad = eitherTMonad;
EitherT.MonadError = eitherTMonadError;

// -- HKT

export interface EitherTF extends TyK<[unknown, unknown, unknown]> {
  [$type]: EitherT<TyVar<this, 0>, TyVar<this, 1>, TyVar<this, 2>>;
}
