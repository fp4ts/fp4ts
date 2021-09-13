import { Auto, Kind1, URIS } from '../../../core';
import { Outcome as OutcomeBase } from './algebra';
import { canceled, failure, success } from './constructors';

export type Outcome<F extends URIS, E, A> = OutcomeBase<F, E, A>;

export const Outcome: OutcomeObj = function <F extends URIS, C, A>(
  fa: Kind1<F, C, A>,
): Outcome<F, never, A> {
  return success(fa);
};

interface OutcomeObj {
  <F extends URIS, C, A>(fa: Kind1<F, C, A>): Outcome<F, never, A>;

  success: <F extends URIS, C, A>(fa: Kind1<F, C, A>) => Outcome<F, never, A>;

  failure: <F extends URIS, E>(e: E) => Outcome<F, E, never>;

  canceled: <F extends URIS>() => Outcome<F, never, never>;
}

Outcome.success = success;
Outcome.failure = failure;
Outcome.canceled = canceled;
