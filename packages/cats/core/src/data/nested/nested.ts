// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, Kind, TyK, TyVar } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Applicative } from '../../applicative';

import { Nested as NestedBase } from './algebra';
import { liftF } from './constructors';
import { nestedApplicative, nestedEq } from './instances';

export type Nested<F, G, A> = NestedBase<F, G, A>;
export const Nested: NestedObj = function <F, G, A>(
  fga: Kind<F, [Kind<G, [A]>]>,
): Nested<F, G, A> {
  return liftF(fga);
};

interface NestedObj {
  <F, G, A>(fga: Kind<F, [Kind<G, [A]>]>): Nested<F, G, A>;
  liftF<F, G, A>(fga: Kind<F, [Kind<G, [A]>]>): Nested<F, G, A>;

  Eq<F, G, A>(E: Eq<Kind<F, [Kind<G, [A]>]>>): Eq<Nested<F, G, A>>;

  Applicative<F, G>(
    F: Applicative<F>,
    G: Applicative<G>,
  ): Applicative<$<NestedF, [F, G]>>;
}

Nested.liftF = liftF;
Nested.Eq = nestedEq;
Nested.Applicative = nestedApplicative;

// -- HKT

/**
 * @category Type Constructor
 * @category Data
 */
export interface NestedF extends TyK<[unknown, unknown, unknown]> {
  [$type]: Nested<TyVar<this, 0>, TyVar<this, 1>, TyVar<this, 2>>;
}
