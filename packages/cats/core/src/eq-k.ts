// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  $type,
  instance,
  Base,
  Kind,
  TyK,
  TyVar,
  HKT1,
  HKT,
} from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { FunctionK } from './arrow';
import { ComposedEqK } from './composed';

export interface EqK<F> extends Base<F> {
  liftEq<A>(E: Eq<A>): Eq<Kind<F, [A]>>;

  lift<A>(p: (l: A, r: A) => boolean): Eq<Kind<F, [A]>>;
}

export type EqKRequirements<F> = Pick<EqK<F>, 'liftEq'> & Partial<EqK<F>>;
function of<F>(F: EqKRequirements<F>): EqK<F>;
function of<F>(F: EqKRequirements<HKT1<F>>): EqK<HKT1<F>> {
  const self: EqK<HKT1<F>> = instance({
    lift: p => self.liftEq(Eq.of({ equals: p })),
    ...F,
  });
  return self;
}

function by<F, G>(fa: EqK<F>, g: FunctionK<G, F>): EqK<G>;
function by<F, G>(
  fa: EqK<HKT1<F>>,
  g: FunctionK<HKT1<G>, HKT1<F>>,
): EqK<HKT1<G>> {
  return EqK.of({
    liftEq: <A>(E: Eq<A>) => Eq.by<HKT<G, [A]>, HKT<F, [A]>>(fa.liftEq(E), g),
  });
}

export const EqK = Object.freeze({
  of,
  compose: <F, G>(F: EqK<F>, G: EqK<G>): ComposedEqK<F, G> => ComposedEqK(F, G),
  by,
});

// -- HKT

export interface EqKF extends TyK<[unknown]> {
  [$type]: EqK<TyVar<this, 0>>;
}
