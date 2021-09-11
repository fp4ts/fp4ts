import { URI } from '../../../core';
import { SemigroupK } from '../../semigroup-k';
import { Applicative } from '../../applicative';
import { Apply } from '../../apply';
import { FlatMap } from '../../flat-map';
import { Functor } from '../../functor';
import { Monad } from '../../monad';

import { Either as EitherBase } from './algebra';
import { left, pure, right, rightUnit } from './constructors';
import {
  Variance,
  eitherApplicative,
  eitherApply,
  eitherFlatMap,
  eitherFunctor,
  eitherMonad,
  eitherSemigroupK,
} from './instances';

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

  // -- Instances
  readonly SemigroupK: SemigroupK<[URI<EitherURI, Variance>], Variance>;
  readonly Functor: Functor<[URI<EitherURI, Variance>], Variance>;
  readonly Apply: Apply<[URI<EitherURI, Variance>], Variance>;
  readonly Applicative: Applicative<[URI<EitherURI, Variance>], Variance>;
  readonly FlatMap: FlatMap<[URI<EitherURI, Variance>], Variance>;
  readonly Monad: Monad<[URI<EitherURI, Variance>], Variance>;
}

Either.right = right;
Either.left = left;
Either.pure = pure;
Either.rightUnit = rightUnit;

Object.defineProperty(Either, 'SemigroupK', {
  get(): SemigroupK<[URI<EitherURI, Variance>], Variance> {
    return eitherSemigroupK();
  },
});
Object.defineProperty(Either, 'Functor', {
  get(): Functor<[URI<EitherURI, Variance>], Variance> {
    return eitherFunctor();
  },
});
Object.defineProperty(Either, 'Apply', {
  get(): Apply<[URI<EitherURI, Variance>], Variance> {
    return eitherApply();
  },
});
Object.defineProperty(Either, 'Applicative', {
  get(): Applicative<[URI<EitherURI, Variance>], Variance> {
    return eitherApplicative();
  },
});
Object.defineProperty(Either, 'FlatMap', {
  get(): FlatMap<[URI<EitherURI, Variance>], Variance> {
    return eitherFlatMap();
  },
});
Object.defineProperty(Either, 'Monad', {
  get(): Monad<[URI<EitherURI, Variance>], Variance> {
    return eitherMonad();
  },
});

// HKT

export const EitherURI = 'cats/data/either';
export type EitherURI = typeof EitherURI;

declare module '../../../core/hkt/hkt' {
  interface URItoKind<FC, S, R, E, A> {
    [EitherURI]: Either<E, A>;
  }
}
