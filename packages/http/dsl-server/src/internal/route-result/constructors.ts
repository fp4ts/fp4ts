// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Applicative, Either, EitherT, Functor } from '@fp4ts/cats';
import { flow, Kind } from '@fp4ts/core';
import { MessageFailure } from '@fp4ts/http-core';
import { Fail, FatalFail, Route, RouteResult, RouteResultT } from './algebra';

export const succeed = <A>(a: A): RouteResult<A> => new Route(a);
export const succeedUnit: RouteResult<void> = succeed(undefined as void);

export const fail = <A = never>(mf: MessageFailure): RouteResult<A> =>
  new Fail(mf);

export const fatalFail = <A = never>(mf: MessageFailure): RouteResult<A> =>
  new FatalFail(mf);

export const succeedT = <F>(
  F: Applicative<F>,
): (<A>(a: A) => RouteResultT<F, A>) => flow(succeed, lift(F));

export const succeedTUnit = <F>(F: Applicative<F>): RouteResultT<F, void> =>
  succeedT(F)(undefined as void);

export const failT = <F, A = never>(
  F: Applicative<F>,
): ((mf: MessageFailure) => RouteResultT<F, A>) => flow(fail, lift(F));

export const fatalFailT = <F, A = never>(
  F: Applicative<F>,
): ((mf: MessageFailure) => RouteResultT<F, A>) => flow(fatalFail, lift(F));

export const fromEither = <A>(ea: Either<MessageFailure, A>): RouteResult<A> =>
  ea.fold(fail, succeed);

export const fromEitherFatal = <A>(
  ea: Either<MessageFailure, A>,
): RouteResult<A> => ea.fold(fatalFail, succeed);

export const fromEitherT =
  <F>(F: Functor<F>) =>
  <A>(ea: EitherT<F, MessageFailure, A>): RouteResultT<F, A> =>
    new RouteResultT(ea.fold(F)(fail, succeed));

export const fromEitherTFatal =
  <F>(F: Functor<F>) =>
  <A>(ea: EitherT<F, MessageFailure, A>): RouteResultT<F, A> =>
    new RouteResultT(ea.fold(F)(fatalFail, succeed));

export const liftF =
  <F>(F: Functor<F>) =>
  <A>(fa: Kind<F, [A]>): RouteResultT<F, A> =>
    new RouteResultT(F.map_(fa, succeed));

export const lift =
  <F>(F: Applicative<F>) =>
  <A>(rr: RouteResult<A>): RouteResultT<F, A> =>
    new RouteResultT(F.pure(rr));
