// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Either, Option } from '@fp4ts/cats';
import { Poll, ExitCase, MonadCancel, Temporal } from '@fp4ts/effect';

import { Chunk } from '../chunk';
import {
  Eval,
  Fail,
  Pull,
  Succeed,
  Terminal,
  Output,
  Bind,
  InterruptWhen,
  Acquire,
  GetScope,
} from './algebra';
import { Scope } from '../internal';

export const pure = <F, R>(r: R): Pull<F, never, R> =>
  new Succeed(r) as Pull<any, never, R>;

export const unit: Terminal<void> = pure(undefined) as Terminal<void>;

export const done = <F>(): Pull<F, never, void> => pure(undefined);

export const throwError = <F>(e: Error): Pull<F, never, never> => new Fail(e);

export const evalF = <F, R>(value: Kind<F, [R]>): Pull<F, never, R> =>
  new Eval(value);

export const sleep =
  <F>(t: Temporal<F, Error>) =>
  (ms: number): Pull<F, never, void> =>
    evalF(t.sleep(ms));

export const output1 = <F, O>(value: O): Pull<F, O, void> =>
  new Output(Chunk.singleton(value));

export const outputOption1 = <F, O>(opt: Option<O>): Pull<F, O, void> =>
  opt.map(x => output1<F, O>(x)).getOrElse<Pull<F, O, void>>(() => done());

export const output = <F, O>(chunk: Chunk<O>): Pull<F, O, void> =>
  chunk.isEmpty ? done() : new Output(chunk);

export const defer = <F, O, R>(thunk: () => Pull<F, O, R>): Pull<F, O, R> =>
  new Bind<F, O, any, R>(unit as Pull<any, never, void>, thunk);

export const interruptWhen = <F, O>(
  haltOnSignal: Kind<F, [Either<Error, void>]>,
): Pull<F, O, void> => new InterruptWhen(haltOnSignal);

export const getScope = <F>(): Pull<F, never, Scope<F>> => new GetScope();

export const acquire = <F, R>(
  resource: Kind<F, [R]>,
  release: (r: R, ec: ExitCase) => Kind<F, [void]>,
): Pull<F, never, R> => new Acquire(resource, release, /* cancelable */ false);

export const acquireCancelable =
  <F>(F: MonadCancel<F, Error>) =>
  <R>(
    acquire: (p: Poll<F>) => Kind<F, [R]>,
    release: (r: R, ec: ExitCase) => Kind<F, [void]>,
  ): Pull<F, never, R> =>
    new Acquire(F.uncancelable(acquire), release, /* cancelable */ true);
