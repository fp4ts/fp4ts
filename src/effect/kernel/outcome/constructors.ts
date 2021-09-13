import { Kind1, URIS } from '../../../core';
import { Canceled, Failure, Outcome, Success } from './algebra';

export const success = <F extends URIS, C, A>(
  fa: Kind1<F, C, A>,
): Outcome<F, never, A> => new Success(fa);

export const failure = <F extends URIS, E>(e: E): Outcome<F, E, never> =>
  new Failure(e);

export const canceled = <F extends URIS>(): Outcome<F, never, never> =>
  new Canceled();
