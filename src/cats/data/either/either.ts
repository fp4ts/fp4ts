import { Applicative2, Applicative2C } from '../../applicative';
import { Apply2, Apply2C } from '../../apply';
import { FlatMap2, FlatMap2C } from '../../flat-map';
import { Functor2, Functor2C } from '../../functor';
import { Monad2, Monad2C } from '../../monad';

import { Either as EitherBase } from './algebra';
import { left, pure, right, rightUnit } from './constructors';
import {
  eitherApplicative2,
  eitherApplicative2C,
  eitherApply2,
  eitherApply2C,
  eitherFlatMap2,
  eitherFlatMap2C,
  eitherFunctor2,
  eitherFunctor2C,
  eitherMonad2,
  eitherMonad2C,
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

  Functor2C: <E>() => Functor2C<URI, E>;
  Apply2C: <E>() => Apply2C<URI, E>;
  Applicative2C: <E>() => Applicative2C<URI, E>;
  FlatMap2C: <E>() => FlatMap2C<URI, E>;
  Monad2C: <E>() => Monad2C<URI, E>;
  readonly Functor2: Functor2<URI>;
  readonly Apply2: Apply2<URI>;
  readonly Applicative2: Applicative2<URI>;
  readonly FlatMap2: FlatMap2<URI>;
  readonly Monad2: Monad2<URI>;
}

Either.right = right;
Either.left = left;
Either.pure = pure;
Either.rightUnit = rightUnit;

Either.Functor2C = eitherFunctor2C;
Object.defineProperty(Either, 'Functor2', {
  get(): Functor2<URI> {
    return eitherFunctor2();
  },
});
Either.Apply2C = eitherApply2C;
Object.defineProperty(Either, 'Apply2', {
  get(): Apply2<URI> {
    return eitherApply2();
  },
});
Either.Applicative2C = eitherApplicative2C;
Object.defineProperty(Either, 'Applicative2', {
  get(): Applicative2<URI> {
    return eitherApplicative2();
  },
});
Either.FlatMap2C = eitherFlatMap2C;
Object.defineProperty(Either, 'FlatMap2', {
  get(): FlatMap2<URI> {
    return eitherFlatMap2();
  },
});
Either.Monad2C = eitherMonad2C;
Object.defineProperty(Either, 'Monad2', {
  get(): Monad2<URI> {
    return eitherMonad2();
  },
});

// HKT

export const URI = 'cats/data/either';
export type URI = typeof URI;

declare module '../../../fp/hkt' {
  interface URItoKind<A> {
    [URI]: Either<unknown, A>;
  }

  interface URItoKind2<E, A> {
    [URI]: Either<E, A>;
  }
}
