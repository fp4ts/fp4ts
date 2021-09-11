import { Kind1, URIS } from '../../../core';
import { Canceled, Failure, Outcome, Success } from './algebra';

export const success = <F extends URIS, C, A>(
  fa: Kind1<F, C, A>,
): Outcome<F, never, A, C> => new Success(fa);

export const failure = <F extends URIS, C2, E>(
  e: E,
): Outcome<F, E, never, C2> => new Failure(e);

export const canceled = <F extends URIS, C2>(): Outcome<F, never, never, C2> =>
  new Canceled();
