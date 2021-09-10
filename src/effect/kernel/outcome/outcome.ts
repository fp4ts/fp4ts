import { Auto, Fix, Kind, URIS } from '../../../core';
import { Outcome as OutcomeBase } from './algebra';
import { canceled, failure, success } from './constructors';

export type Outcome<F extends URIS, E, A, C2 = Auto> = OutcomeBase<F, E, A, C2>;

export const Outcome: OutcomeObj = function <F extends URIS, C2, S2, R2, E2, A>(
  fa: Kind<F, C2, S2, R2, E2, A>,
): Outcome<F, never, A, C2 & Fix<'S', S2> & Fix<'R', R2> & Fix<'E', E2>> {
  return success(fa);
};

interface OutcomeObj {
  <F extends URIS, C2, S2, R2, E2, A>(fa: Kind<F, C2, S2, R2, E2, A>): Outcome<
    F,
    never,
    A,
    C2 & Fix<'S', S2> & Fix<'R', R2> & Fix<'E', E2>
  >;

  success: <F extends URIS, C2, S2, R2, E2, A>(
    fa: Kind<F, C2, S2, R2, E2, A>,
  ) => Outcome<F, never, A, C2 & Fix<'S', S2> & Fix<'R', R2> & Fix<'E', E2>>;

  failure: <F extends URIS, C2, E>(e: E) => Outcome<F, E, never, C2>;

  canceled: <F extends URIS, C2>() => Outcome<F, never, never, C2>;
}

Outcome.success = success;
Outcome.failure = failure;
Outcome.canceled = canceled;
