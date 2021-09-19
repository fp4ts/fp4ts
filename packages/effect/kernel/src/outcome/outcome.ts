import { AnyK, TyK, Kind, _ } from '@cats4ts/core';
import { Outcome as OutcomeBase } from './algebra';
import { canceled, failure, success } from './constructors';

export type Outcome<F extends AnyK, E, A> = OutcomeBase<F, E, A>;

export const Outcome: OutcomeObj = function <F extends AnyK, A>(
  fa: Kind<F, [A]>,
): Outcome<F, never, A> {
  return success(fa);
};

interface OutcomeObj {
  <F extends AnyK, A>(fa: Kind<F, [A]>): Outcome<F, never, A>;

  success: <F extends AnyK, A>(fa: Kind<F, [A]>) => Outcome<F, never, A>;

  failure: <F extends AnyK, E>(e: E) => Outcome<F, E, never>;

  canceled: <F extends AnyK>() => Outcome<F, never, never>;
}

Outcome.success = success;
Outcome.failure = failure;
Outcome.canceled = canceled;

export const OutcomeURI = 'effect/kernel/outcome';
export type OutcomeURI = typeof OutcomeURI;
export type OutcomeK = TyK<OutcomeURI, [_, _, _]>;

declare module '@cats4ts/core/lib/hkt/hkt' {
  interface URItoKind<Tys extends unknown[]> {
    [OutcomeURI]: Tys[0] extends AnyK ? Outcome<Tys[0], Tys[1], Tys[3]> : never;
  }
}
