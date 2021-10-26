import { Kind } from '@fp4ts/core';
import { Canceled, Failure, Outcome, Success } from './algebra';

export const success = <F, A>(fa: Kind<F, [A]>): Outcome<F, never, A> =>
  new Success(fa);

export const failure = <F, E>(e: E): Outcome<F, E, never> => new Failure(e);

export const canceled = <F>(): Outcome<F, never, never> => new Canceled();
