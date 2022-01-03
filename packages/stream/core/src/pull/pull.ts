// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Either, Option } from '@fp4ts/cats';
import { Poll, ExitCase, MonadCancel, Temporal } from '@fp4ts/effect';

import { Pull as PullBase } from './algebra';
import { Chunk } from '../chunk';
import {
  done,
  evalF,
  output,
  output1,
  outputOption1,
  pure,
  sleep,
  defer,
  throwError,
  interruptWhen,
  acquire,
  acquireCancelable,
  getScope,
} from './constructors';
import { loop } from './operators';
import { Scope } from '../internal';

export type Pull<F, O, R> = PullBase<F, O, R>;

export const Pull: PullObj = function () {};

interface PullObj {
  pure<F, R>(r: R): Pull<F, never, R>;
  done<F>(): Pull<F, never, void>;
  throwError<F>(e: Error): Pull<F, never, never>;
  evalF<F, R>(value: Kind<F, [R]>): Pull<F, never, R>;
  sleep<F>(t: Temporal<F, Error>): (ms: number) => Pull<F, never, void>;
  output1<F, O>(value: O): Pull<F, O, void>;
  outputOption1<F, O>(value: Option<O>): Pull<F, O, void>;
  output<F, O>(chunk: Chunk<O>): Pull<F, O, void>;
  defer<F, O, R>(thunk: () => Pull<F, O, R>): Pull<F, O, R>;

  getScope<F>(): Pull<F, never, Scope<F>>;
  acquire<F, R>(
    resource: Kind<F, [R]>,
    release: (r: R, ec: ExitCase) => Kind<F, [void]>,
  ): Pull<F, never, R>;
  acquireCancelable<F>(
    F: MonadCancel<F, Error>,
  ): <R>(
    acquire: (p: Poll<F>) => Kind<F, [R]>,
    release: (r: R, ec: ExitCase) => Kind<F, [void]>,
  ) => Pull<F, never, R>;
  interruptWhen<F, O = never>(
    haltOnSignal: Kind<F, [Either<Error, void>]>,
  ): Pull<F, O, void>;

  loop<F, O, R>(f: (r: R) => Pull<F, O, Option<R>>): (r: R) => Pull<F, O, void>;
}

Pull.pure = pure;
Pull.done = done;
Pull.throwError = throwError;
Pull.evalF = evalF;
Pull.sleep = sleep;
Pull.output1 = output1;
Pull.outputOption1 = outputOption1;
Pull.output = output;
Pull.defer = defer;

Pull.getScope = getScope;
Pull.acquire = acquire;
Pull.acquireCancelable = acquireCancelable;
Pull.interruptWhen = interruptWhen;

Pull.loop = loop;
