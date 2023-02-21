// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Functor } from '@fp4ts/cats-core';
import { Profunctor, ProfunctorRequirements } from './profunctor';

/**
 * @category Type Class
 * @category Profunctor
 */
export interface Sieve<P, F> extends Profunctor<P> {
  readonly F: Functor<F>;

  sieve<A, B>(pab: Kind<P, [A, B]>): (a: A) => Kind<F, [B]>;
}

export type SieveRequirements<P, F> = Pick<Sieve<P, F>, 'sieve' | 'F'> &
  ProfunctorRequirements<P> &
  Partial<Sieve<P, F>>;
export const Sieve = Object.freeze({
  of: <P, F>(P: SieveRequirements<P, F>): Sieve<P, F> => ({
    ...Profunctor.of(P),
    ...P,
  }),
});

/**
 * @category Type Class
 * @category Profunctor
 */
export interface Cosieve<P, F> extends Profunctor<P> {
  readonly C: Functor<F>;

  cosieve<A, B>(pab: Kind<P, [A, B]>): (a: Kind<F, [A]>) => B;
}

export type CosieveRequirements<P, F> = Pick<Cosieve<P, F>, 'cosieve' | 'C'> &
  ProfunctorRequirements<P> &
  Partial<Cosieve<P, F>>;
export const Cosieve = Object.freeze({
  of: <P, F>(P: CosieveRequirements<P, F>): Cosieve<P, F> => ({
    ...Profunctor.of(P),
    ...P,
  }),
});
