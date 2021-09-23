import { Option } from '@cats4ts/cats-core/lib/data';
import { AnyK, Kind } from '@cats4ts/core';
import { Temporal } from '@cats4ts/effect-kernel';

import { Chunk } from '../chunk';
import { Eval, Fail, Pull, Succeed, Terminal, Output, Bind } from './algebra';

export const pure = <F extends AnyK, R>(r: R): Pull<F, never, R> =>
  new Succeed(r) as Pull<any, never, R>;

export const unit: Terminal<void> = pure(undefined) as Terminal<void>;

export const done = <F extends AnyK>(): Pull<F, never, void> => pure(undefined);

export const throwError = <F extends AnyK>(e: Error): Pull<F, never, never> =>
  new Fail(e) as Pull<any, never, never>;

export const evalF = <F extends AnyK, R>(
  value: Kind<F, [R]>,
): Pull<F, never, R> => new Eval(value);

export const sleep =
  <F extends AnyK>(t: Temporal<F, Error>) =>
  (ms: number): Pull<F, never, void> =>
    evalF(t.sleep(ms));

export const output1 = <F extends AnyK, O>(value: O): Pull<F, O, void> =>
  new Output(Chunk.singleton(value));

export const outputOption1 = <F extends AnyK, O>(
  opt: Option<O>,
): Pull<F, O, void> =>
  opt.map(x => output1<F, O>(x)).getOrElse<Pull<F, O, void>>(() => done());

export const output = <F extends AnyK, O>(chunk: Chunk<O>): Pull<F, O, void> =>
  chunk.isEmpty ? done() : new Output(chunk);

export const suspend = <F extends AnyK, O, R>(
  thunk: () => Pull<F, O, R>,
): Pull<F, O, R> =>
  new Bind<F, O, any, R>(unit as Pull<any, never, void>, thunk);
