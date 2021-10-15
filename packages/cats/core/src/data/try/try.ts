import { $type, TyK, TyVar } from '@cats4ts/core';
import { Eq } from '../../eq';
import { SemigroupK } from '../../semigroup-k';
import { Functor } from '../../functor';
import { FunctorFilter } from '../../functor-filter';
import { Apply } from '../../apply';
import { Applicative } from '../../applicative';
import { ApplicativeError } from '../../applicative-error';
import { FlatMap } from '../../flat-map';
import { Monad } from '../../monad';
import { MonadError } from '../../monad-error';
import { Option } from '../option';
import { Either } from '../either';

import { Try as TryBase } from './algebra';
import { failure, fromEither, fromOption, of, success } from './constructors';
import {
  tryApplicative,
  tryApplicativeError,
  tryApply,
  tryEq,
  tryFlatMap,
  tryFunctor,
  tryFunctorFilter,
  tryMonad,
  tryMonadError,
  trySemigroupK,
} from './instances';

export type Try<A> = TryBase<A>;

export const Try: TryObj = function <A>(thunk: () => A) {
  return of(thunk);
} as any;

export const Success = success;
export const Failure = failure;

interface TryObj {
  <A>(thunk: () => A): Try<A>;
  of<A>(thunk: () => A): Try<A>;
  success<A>(a: A): Try<A>;
  failure(e: Error): Try<never>;
  fromOption<A>(o: Option<A>): Try<A>;
  fromEither<A>(ea: Either<Error, A>): Try<A>;

  // -- Instances

  Eq<A>(EE: Eq<Error>, EA: Eq<A>): Eq<Try<A>>;
  readonly SemigroupK: SemigroupK<TryK>;
  readonly Functor: Functor<TryK>;
  readonly FunctorFilter: FunctorFilter<TryK>;
  readonly Apply: Apply<TryK>;
  readonly Applicative: Applicative<TryK>;
  readonly ApplicativeError: ApplicativeError<TryK, Error>;
  readonly FlatMap: FlatMap<TryK>;
  readonly Monad: Monad<TryK>;
  readonly MonadError: MonadError<TryK, Error>;
}

Try.of = of;
Try.success = success;
Try.failure = failure;
Try.fromOption = fromOption;
Try.fromEither = fromEither;

Try.Eq = tryEq;
Object.defineProperty(Try, 'SemigroupK', {
  get(): SemigroupK<TryK> {
    return trySemigroupK();
  },
});
Object.defineProperty(Try, 'Functor', {
  get(): Functor<TryK> {
    return tryFunctor();
  },
});
Object.defineProperty(Try, 'FunctorFilter', {
  get(): FunctorFilter<TryK> {
    return tryFunctorFilter();
  },
});
Object.defineProperty(Try, 'Apply', {
  get(): Apply<TryK> {
    return tryApply();
  },
});
Object.defineProperty(Try, 'Applicative', {
  get(): Applicative<TryK> {
    return tryApplicative();
  },
});
Object.defineProperty(Try, 'ApplicativeError', {
  get(): ApplicativeError<TryK, Error> {
    return tryApplicativeError();
  },
});
Object.defineProperty(Try, 'FlatMap', {
  get(): FlatMap<TryK> {
    return tryFlatMap();
  },
});
Object.defineProperty(Try, 'Monad', {
  get(): Monad<TryK> {
    return tryMonad();
  },
});
Object.defineProperty(Try, 'MonadError', {
  get(): MonadError<TryK, Error> {
    return tryMonadError();
  },
});

// -- HKT

export interface TryK extends TyK<[unknown]> {
  [$type]: Try<TyVar<this, 0>>;
}
