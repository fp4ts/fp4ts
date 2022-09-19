// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, HKT, TyK, TyVar } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { SemigroupK } from '../../semigroup-k';
import { Applicative } from '../../applicative';
import { ApplicativeError } from '../../applicative-error';
import { Apply } from '../../apply';
import { Bifunctor } from '../../bifunctor';
import { FlatMap } from '../../flat-map';
import { Functor } from '../../functor';
import { Monad } from '../../monad';
import { MonadError } from '../../monad-error';

import { Either as EitherBase } from './algebra';
import { left, pure, right, rightUnit } from './constructors';
import {
  eitherApplicative,
  eitherApplicativeError,
  eitherApply,
  eitherBifunctor,
  eitherEq,
  eitherFlatMap,
  eitherFunctor,
  eitherMonad,
  eitherMonadError,
  eitherSemigroupK,
} from './instances';
import { tailRecM } from './operators';

export type Either<E, A> = EitherBase<E, A>;

export const Either: EitherObj = function <A, E = never>(a: A): Either<E, A> {
  return right(a);
} as any;

export const Right = right;
export const Left = left;

export interface EitherObj {
  <A, E = never>(a: A): Either<E, A>;
  right: <A, E = never>(a: A) => Either<E, A>;
  pure: <A, E = never>(a: A) => Either<E, A>;
  left: <E, A = never>(e: E) => Either<E, A>;
  rightUnit: Either<never, void>;

  tailRecM: <A>(
    a: A,
  ) => <E, B>(f: (a: A) => Either<E, Either<A, B>>) => Either<E, B>;

  // -- Instances
  SemigroupK<E>(): SemigroupK<$<EitherF, [E]>>;
  Functor<E>(): Functor<$<EitherF, [E]>>;
  readonly Bifunctor: Bifunctor<EitherF>;
  Apply<E>(): Apply<$<EitherF, [E]>>;
  Applicative<E>(): Applicative<$<EitherF, [E]>>;
  ApplicativeError<E>(): ApplicativeError<$<EitherF, [E]>, E>;
  FlatMap<E>(): FlatMap<$<EitherF, [E]>>;
  Monad<E>(): Monad<$<EitherF, [E]>>;
  MonadError<E>(): MonadError<$<EitherF, [E]>, E>;
  Eq<E, A>(EE: Eq<E>, EA: Eq<A>): Eq<Either<E, A>>;
}

Either.right = right;
Either.left = left;
Either.pure = pure;
Either.rightUnit = rightUnit;
Either.tailRecM = tailRecM;

Either.SemigroupK = eitherSemigroupK;
Either.Functor = eitherFunctor;
Object.defineProperty(Either, 'Bifunctor', {
  get(): Bifunctor<EitherF> {
    return eitherBifunctor();
  },
});
Either.Apply = eitherApply;
Either.Applicative = eitherApplicative;
Either.ApplicativeError = eitherApplicativeError;
Either.FlatMap = eitherFlatMap;
Either.Monad = eitherMonad;
Either.MonadError = eitherMonadError;
Either.Eq = eitherEq;

// -- HKT

declare module './algebra' {
  export interface Either<E, A> extends HKT<EitherF, [E, A]> {}
}

/**
 * @category Type Constructor
 * @category Data
 */
export interface EitherF extends TyK<[unknown, unknown]> {
  [$type]: Either<TyVar<this, 0>, TyVar<this, 1>>;
}
