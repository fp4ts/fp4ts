import { Kind } from '@fp4ts/core';
import { Either, Option } from '@fp4ts/cats';
import { Temporal } from '@fp4ts/effect';

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
} from './algebra';

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
