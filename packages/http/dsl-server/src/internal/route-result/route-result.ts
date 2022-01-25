// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, Kind, TyK, TyVar } from '@fp4ts/core';
import {
  Alternative,
  Applicative,
  Either,
  EitherT,
  Functor,
  Monad,
} from '@fp4ts/cats';
import { MessageFailure } from '@fp4ts/http-core';
import {
  RouteResult as RouteResultBase,
  RouteResultT as RouteResultTBase,
} from './algebra';
import {
  fail,
  failT,
  fatalFail,
  fatalFailT,
  fromEither,
  fromEitherFatal,
  fromEitherT,
  fromEitherTFatal,
  lift,
  succeed,
  succeedT,
  succeedTUnit,
  succeedUnit,
} from './constructors';
import {
  routeResultAlternative,
  routeResultFunctor,
  routeResultMonad,
  routeResultTAlternative,
  routeResultTFunctor,
  routeResultTMonad,
} from './instances';

export type RouteResult<A> = RouteResultBase<A>;
export const RouteResult: RouteResultObj = function <A>(a: A) {
  return succeed(a);
} as any;

export type RouteResultT<F, A> = RouteResultTBase<F, A>;
export const RouteResultT: RouteResultTObj = function (fa) {
  return new RouteResultTBase(fa);
};

interface RouteResultObj {
  <A>(a: A): RouteResult<A>;

  succeed<A>(a: A): RouteResult<A>;
  readonly succeedUnit: RouteResult<void>;
  fail<A = never>(): RouteResult<A>;
  fatalFail<A = never>(failure: MessageFailure): RouteResult<A>;

  fromEither<A>(ea: Either<MessageFailure, A>): RouteResult<A>;
  fromEitherFatal<A>(ea: Either<MessageFailure, A>): RouteResult<A>;

  // -- Instances

  readonly Functor: Functor<RouteResultK>;
  readonly Alternative: Alternative<RouteResultK>;
  readonly Monad: Monad<RouteResultK>;
}
RouteResult.succeed = succeed;
Object.defineProperty(RouteResult, 'succeedUnit', {
  get() {
    return succeedUnit;
  },
});
RouteResult.fail = fail;
RouteResult.fatalFail = fatalFail;
RouteResult.fromEither = fromEither;
RouteResult.fromEitherFatal = fromEitherFatal;

Object.defineProperty(RouteResult, 'Functor', {
  get() {
    return routeResultFunctor();
  },
});
Object.defineProperty(RouteResult, 'Alternative', {
  get() {
    return routeResultAlternative();
  },
});
Object.defineProperty(RouteResult, 'Monad', {
  get() {
    return routeResultMonad();
  },
});

interface RouteResultTObj {
  <F, A>(fa: Kind<F, [RouteResult<A>]>): RouteResultT<F, A>;

  succeed<F>(F: Applicative<F>): <A>(a: A) => RouteResultT<F, A>;
  succeedUnit<F>(F: Applicative<F>): RouteResultT<F, void>;
  fail<F, A = never>(F: Applicative<F>): RouteResultT<F, A>;
  fatalFail<F, A = never>(
    F: Applicative<F>,
  ): (failure: MessageFailure) => RouteResultT<F, A>;

  fromEither<F>(
    F: Functor<F>,
  ): <A>(ea: EitherT<F, MessageFailure, A>) => RouteResultT<F, A>;
  fromEitherFatal<F>(
    F: Functor<F>,
  ): <A>(ea: EitherT<F, MessageFailure, A>) => RouteResultT<F, A>;
  lift<F>(F: Applicative<F>): <A>(ra: RouteResult<A>) => RouteResultT<F, A>;

  // -- Instances

  Functor<F>(F: Functor<F>): Functor<$<RouteResultTK, [F]>>;
  Alternative<F>(F: Monad<F>): Alternative<$<RouteResultTK, [F]>>;
  Monad<F>(F: Monad<F>): Monad<$<RouteResultTK, [F]>>;
}
RouteResultT.succeed = succeedT;
RouteResultT.succeedUnit = succeedTUnit;
RouteResultT.fail = failT;
RouteResultT.fatalFail = fatalFailT;
RouteResultT.lift = lift;
RouteResultT.fromEither = fromEitherT;
RouteResultT.fromEitherFatal = fromEitherTFatal;

RouteResultT.Functor = routeResultTFunctor;
RouteResultT.Alternative = routeResultTAlternative;
RouteResultT.Monad = routeResultTMonad;

// -- HKT

export interface RouteResultK extends TyK<[unknown]> {
  [$type]: RouteResult<TyVar<this, 0>>;
}

export interface RouteResultTK extends TyK<[unknown, unknown]> {
  [$type]: RouteResultT<TyVar<this, 0>, TyVar<this, 1>>;
}
