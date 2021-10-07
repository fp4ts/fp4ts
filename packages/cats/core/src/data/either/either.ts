import { $, TyK, _ } from '@cats4ts/core';
import { SemigroupK } from '../../semigroup-k';
import { Applicative } from '../../applicative';
import { ApplicativeError } from '../../applicative-error';
import { Apply } from '../../apply';
import { Bifunctor } from '../../bifunctor';
import { FlatMap } from '../../flat-map';
import { Functor } from '../../functor';
import { Monad } from '../../monad';
import { MonadError } from '../../monad-error';
import { Eq } from '../../eq';

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
  SemigroupK<E>(): SemigroupK<$<EitherK, [E]>>;
  Functor<E>(): Functor<$<EitherK, [E]>>;
  readonly Bifunctor: Bifunctor<EitherK>;
  Apply<E>(): Apply<$<EitherK, [E]>>;
  Applicative<E>(): Applicative<$<EitherK, [E]>>;
  ApplicativeError<E>(): ApplicativeError<$<EitherK, [E]>, E>;
  FlatMap<E>(): FlatMap<$<EitherK, [E]>>;
  Monad<E>(): Monad<$<EitherK, [E]>>;
  MonadError<E>(): MonadError<$<EitherK, [E]>, E>;
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
  get(): Bifunctor<EitherK> {
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

// HKT

export const EitherURI = 'cats/data/either';
export type EitherURI = typeof EitherURI;
export type EitherK = TyK<EitherURI, [_, _]>;

declare module '@cats4ts/core/lib/hkt/hkt' {
  interface URItoKind<Tys extends unknown[]> {
    [EitherURI]: Either<Tys[0], Tys[1]>;
  }
}
