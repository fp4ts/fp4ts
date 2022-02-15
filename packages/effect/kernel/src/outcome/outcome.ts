// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { TyK, Kind, $type, TyVar } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats';
import { Outcome as OutcomeBase } from './algebra';
import { canceled, failure, success } from './constructors';
import { outcomeEq } from './instances';

export type Outcome<F, E, A> = OutcomeBase<F, E, A>;

export const Outcome: OutcomeObj = function <F, A>(
  fa: Kind<F, [A]>,
): Outcome<F, never, A> {
  return success(fa);
};

interface OutcomeObj {
  <F, A>(fa: Kind<F, [A]>): Outcome<F, never, A>;
  success: <F, A>(fa: Kind<F, [A]>) => Outcome<F, never, A>;
  failure: <F, E>(e: E) => Outcome<F, E, never>;
  canceled: <F>() => Outcome<F, never, never>;

  // -- Instances

  Eq<F, E, A>(EE: Eq<E>, EFA: Eq<Kind<F, [A]>>): Eq<Outcome<F, E, A>>;
}

Outcome.success = success;
Outcome.failure = failure;
Outcome.canceled = canceled;

Outcome.Eq = outcomeEq;

// -- HKT

export interface OutcomeF extends TyK<[unknown, unknown, unknown]> {
  [$type]: Outcome<TyVar<this, 0>, TyVar<this, 1>, TyVar<this, 2>>;
}
