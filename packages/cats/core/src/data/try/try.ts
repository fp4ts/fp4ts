// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $type, TyK, TyVar } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
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
  readonly SemigroupK: SemigroupK<TryF>;
  readonly Functor: Functor<TryF>;
  readonly FunctorFilter: FunctorFilter<TryF>;
  readonly Apply: Apply<TryF>;
  readonly Applicative: Applicative<TryF>;
  readonly ApplicativeError: ApplicativeError<TryF, Error>;
  readonly FlatMap: FlatMap<TryF>;
  readonly Monad: Monad<TryF>;
  readonly MonadError: MonadError<TryF, Error>;
}

Try.of = of;
Try.success = success;
Try.failure = failure;
Try.fromOption = fromOption;
Try.fromEither = fromEither;

Try.Eq = tryEq;
Object.defineProperty(Try, 'SemigroupK', {
  get(): SemigroupK<TryF> {
    return trySemigroupK();
  },
});
Object.defineProperty(Try, 'Functor', {
  get(): Functor<TryF> {
    return tryFunctor();
  },
});
Object.defineProperty(Try, 'FunctorFilter', {
  get(): FunctorFilter<TryF> {
    return tryFunctorFilter();
  },
});
Object.defineProperty(Try, 'Apply', {
  get(): Apply<TryF> {
    return tryApply();
  },
});
Object.defineProperty(Try, 'Applicative', {
  get(): Applicative<TryF> {
    return tryApplicative();
  },
});
Object.defineProperty(Try, 'ApplicativeError', {
  get(): ApplicativeError<TryF, Error> {
    return tryApplicativeError();
  },
});
Object.defineProperty(Try, 'FlatMap', {
  get(): FlatMap<TryF> {
    return tryFlatMap();
  },
});
Object.defineProperty(Try, 'Monad', {
  get(): Monad<TryF> {
    return tryMonad();
  },
});
Object.defineProperty(Try, 'MonadError', {
  get(): MonadError<TryF, Error> {
    return tryMonadError();
  },
});

// -- HKT

/**
 * @category Type Constructor
 * @category Data
 */
export interface TryF extends TyK<[unknown]> {
  [$type]: Try<TyVar<this, 0>>;
}
