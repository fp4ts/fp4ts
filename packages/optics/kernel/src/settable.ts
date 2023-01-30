// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { id, instance, Kind, Lazy, lazy } from '@fp4ts/core';
import {
  Applicative,
  ApplicativeRequirements,
  Distributive,
  DistributiveRequirements,
  Identity,
  IdentityF,
  Profunctor,
  Traversable,
  TraversableRequirements,
} from '@fp4ts/cats';

export interface Settable<F>
  extends Applicative<F>,
    Distributive<F>,
    Traversable<F> {
  untainted<A>(fa: Kind<F, [A]>): A;

  untaintedDot<P>(
    P: Profunctor<P>,
  ): <A, B>(pafb: Kind<P, [A, Kind<F, [B]>]>) => Kind<P, [A, B]>;
  taintedDot<P>(
    P: Profunctor<P>,
  ): <A, B>(pafb: Kind<P, [A, B]>) => Kind<P, [A, Kind<F, [B]>]>;
}

export type SettableRequirements<F> = Pick<Settable<F>, 'untainted'> &
  ApplicativeRequirements<F> &
  DistributiveRequirements<F> &
  TraversableRequirements<F>;
export const Settable = Object.freeze({
  of: <F>(F: SettableRequirements<F>): Settable<F> => {
    const self: Settable<F> = instance<Settable<F>>({
      ...Applicative.of(F),
      ...Distributive.of(F),
      ...Traversable.of(F),

      untaintedDot: P => pafb => P.rmap_(pafb, self.untainted),
      taintedDot: P => pafb => P.rmap_(pafb, self.pure),

      ...F,
    });
    return self;
  },

  get Identity(): Settable<IdentityF> {
    return identitySettable();
  },
});

// -- Instances

const identitySettable: Lazy<Settable<IdentityF>> = lazy(
  (): Settable<IdentityF> =>
    Settable.of({
      ...Identity.Applicative,
      ...Identity.Distributive,
      ...Identity.Traversable,
      untainted: id,
    }),
);
