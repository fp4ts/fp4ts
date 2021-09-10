import { Fix, Kind, URIS } from '../../../core';
import { Canceled, Failure, Outcome, Success } from './algebra';

export const success = <F extends URIS, C2, S2, R2, E2, A>(
  fa: Kind<F, C2, S2, R2, E2, A>,
): Outcome<F, never, A, C2 & Fix<'S', S2> & Fix<'R', R2> & Fix<'E', E2>> =>
  new Success(fa);

export const failure = <F extends URIS, C2, E>(
  e: E,
): Outcome<F, E, never, C2> => new Failure(e);

export const canceled = <F extends URIS, C2>(): Outcome<F, never, never, C2> =>
  new Canceled();
