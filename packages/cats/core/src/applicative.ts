// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { HKT1, Kind } from '@fp4ts/core';
import { Functor } from './functor';
import { Apply } from './apply';
import { CoflatMap } from './coflat-map';
import { ComposedApplicative } from './composed';
import { Array } from './data';

/**
 * @category Type Class
 */
export interface Applicative<F> extends Apply<F> {
  readonly pure: <A>(a: A) => Kind<F, [A]>;
  readonly unit: Kind<F, [void]>;

  readonly tupled: <A extends unknown[]>(
    ...fsa: { [k in keyof A]: Kind<F, [A[k]]> }
  ) => Kind<F, [A]>;
}

export type ApplicativeRequirements<F> = Pick<Applicative<F>, 'pure' | 'ap_'> &
  Partial<Applicative<F>>;

function of<F>(F: ApplicativeRequirements<F>): Applicative<F>;
function of<F>(F: ApplicativeRequirements<HKT1<F>>): Applicative<HKT1<F>> {
  const self: Applicative<HKT1<F>> = {
    unit: F.pure(undefined as void),

    tupled: ((...xs) => Array.Traversable().sequence(self)(xs)) as Applicative<
      HKT1<F>
    >['tupled'],

    ...Apply.of<HKT1<F>>({ ...Applicative.functor(F), ...F }),
    ...F,
  };
  return self;
}

function functor<F>(F: ApplicativeRequirements<F>): Functor<F>;
function functor<F>(F: ApplicativeRequirements<HKT1<F>>): Functor<HKT1<F>> {
  return Functor.of<HKT1<F>>({
    map_: (fa, f) => F.ap_(F.pure(f), fa),
    ...F,
  });
}

function coflatMap<F>(F: Applicative<F>): CoflatMap<F>;
function coflatMap<F>(F: Applicative<HKT1<F>>): CoflatMap<HKT1<F>> {
  return CoflatMap.of({ ...F, coflatMap_: (fa, f) => F.pure(f(fa)) });
}

export const Applicative = Object.freeze({
  of,

  compose: <F, G>(
    F: Applicative<F>,
    G: Applicative<G>,
  ): ComposedApplicative<F, G> => ComposedApplicative(F, G),

  functor,
  coflatMap,
});
