import { AnyK, Kind } from '@cats4ts/core';
import { Option } from '@cats4ts/cats-core/lib/data';
import { Temporal } from '@cats4ts/effect-kernel';
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
  suspend,
  throwError,
} from './constructors';

export type Pull<F extends AnyK, O, R> = PullBase<F, O, R>;

export const Pull: PullObj = function () {};

interface PullObj {
  pure<F extends AnyK, R>(r: R): Pull<F, never, R>;
  done<F extends AnyK>(): Pull<F, never, void>;
  throwError<F extends AnyK>(e: Error): Pull<F, never, never>;
  evalF<F extends AnyK, R>(value: Kind<F, [R]>): Pull<F, never, R>;
  sleep<F extends AnyK>(
    t: Temporal<F, Error>,
  ): (ms: number) => Pull<F, never, void>;
  output1<F extends AnyK, O>(value: O): Pull<F, O, void>;
  outputOption1<F extends AnyK, O>(value: Option<O>): Pull<F, O, void>;
  output<F extends AnyK, O>(chunk: Chunk<O>): Pull<F, O, void>;
  suspend<F extends AnyK, O, R>(thunk: () => Pull<F, O, R>): Pull<F, O, R>;
}

Pull.pure = pure;
Pull.done = done;
Pull.throwError = throwError;
Pull.evalF = evalF;
Pull.sleep = sleep;
Pull.output1 = output1;
Pull.outputOption1 = outputOption1;
Pull.output = output;
Pull.suspend = suspend;
