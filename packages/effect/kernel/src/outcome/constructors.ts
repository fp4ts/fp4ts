import { AnyK, Kind } from '@cats4ts/core';
import { Canceled, Failure, Outcome, Success } from './algebra';

export const success = <F extends AnyK, A>(
  fa: Kind<F, [A]>,
): Outcome<F, never, A> => new Success(fa);

export const failure = <F extends AnyK, E>(e: E): Outcome<F, E, never> =>
  new Failure(e);

export const canceled = <F extends AnyK>(): Outcome<F, never, never> =>
  new Canceled();
