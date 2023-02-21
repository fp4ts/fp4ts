// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Function1F, Functor } from '@fp4ts/cats-core';
import { IdentityF } from '@fp4ts/cats-core/lib/data';
import { Kind } from '@fp4ts/core';
import {
  Cosieve,
  CosieveRequirements,
  Sieve,
  SieveRequirements,
} from './sieve';
import {
  Costrong,
  CostrongRequirements,
  Strong,
  StrongRequirements,
} from './strong';
import {
  function1Corepresentable,
  function1Representable,
} from './instances/function';
import { kleisliRepresentable } from './instances/kleisli';
import { cokleisliCorepresentable } from './instances/cokleisli';

/**
 * @category Type Class
 * @category Profunctor
 */
export interface Representable<P, RepF> extends Sieve<P, RepF>, Strong<P> {
  tabulate<A, B>(arb: (a: A) => Kind<RepF, [B]>): Kind<P, [A, B]>;
}

export type RepresentableRequirements<P, RepF> = Pick<
  Representable<P, RepF>,
  'tabulate'
> &
  SieveRequirements<P, RepF> &
  StrongRequirements<P> &
  Partial<Representable<P, RepF>>;
export const Representable = Object.freeze({
  of: <P, RepF>(
    P: RepresentableRequirements<P, RepF>,
  ): Representable<P, RepF> => ({
    ...Sieve.of(P),
    ...Strong.of(P),
    ...P,
  }),

  get Function1() {
    return function1Representable();
  },

  Kleisli: <F>(F: Functor<F>) => kleisliRepresentable(F),
});

/**
 * @category Type Class
 * @category Profunctor
 */
export interface Corepresentable<P, CorepF>
  extends Cosieve<P, CorepF>,
    Costrong<P> {
  cotabulate<A, B>(crab: (ra: Kind<CorepF, [A]>) => B): Kind<P, [A, B]>;
}

export type CorepresentableRequirements<P, RepF> = Pick<
  Corepresentable<P, RepF>,
  'cotabulate'
> &
  CosieveRequirements<P, RepF> &
  CostrongRequirements<P> &
  Partial<Corepresentable<P, RepF>>;
export const Corepresentable = Object.freeze({
  of: <P, RepF>(
    P: CorepresentableRequirements<P, RepF>,
  ): Corepresentable<P, RepF> => ({
    ...Cosieve.of(P),
    ...Costrong.of(P),
    ...P,
  }),

  get Function1(): Corepresentable<Function1F, IdentityF> {
    return function1Corepresentable();
  },

  Cokleisli: <F>(F: Functor<F>) => cokleisliCorepresentable(F),
});
