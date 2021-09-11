import { Auto, Kind1, URIS } from '../../../core';
import { Outcome as OutcomeBase } from './algebra';
import { canceled, failure, success } from './constructors';

export type Outcome<F extends URIS, E, A, C2 = Auto> = OutcomeBase<F, E, A, C2>;

export const Outcome: OutcomeObj = function <F extends URIS, C, A>(
  fa: Kind1<F, C, A>,
): Outcome<F, never, A, C> {
  return success(fa);
};

interface OutcomeObj {
  <F extends URIS, C, A>(fa: Kind1<F, C, A>): Outcome<F, never, A, C>;

  success: <F extends URIS, C, A>(
    fa: Kind1<F, C, A>,
  ) => Outcome<F, never, A, C>;

  failure: <F extends URIS, C, E>(e: E) => Outcome<F, E, never, C>;

  canceled: <F extends URIS, C>() => Outcome<F, never, never, C>;
}

Outcome.success = success;
Outcome.failure = failure;
Outcome.canceled = canceled;
