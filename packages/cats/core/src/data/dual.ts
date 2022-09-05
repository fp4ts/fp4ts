// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $type, TyK, TyVar } from '@fp4ts/core';
import { Monoid, Semigroup } from '@fp4ts/cats-kernel';
import { SemigroupK } from '../semigroup-k';
import { MonoidK } from '../monoid-k';

export type Dual<A> = A;
export const Dual: DualObj = function () {};

interface DualObj {
  // -- Instances

  Semigroup<A>(S: Semigroup<A>): Semigroup<A>;
  Monoid<A>(S: Monoid<A>): Monoid<A>;

  SemigroupK<F>(F: SemigroupK<F>): SemigroupK<F>;
  MonoidK<F>(F: MonoidK<F>): MonoidK<F>;
}

const dualSemigroup = <A>(S: Semigroup<A>): Semigroup<A> =>
  Semigroup.of({
    combine_: (a, b) => S.combine_(b(), () => a),
  });

const dualMonoid = <A>(M: Monoid<A>): Monoid<A> =>
  Monoid.of({ ...dualSemigroup(M), empty: M.empty });

const dualSemigroupK = <F>(F: SemigroupK<F>): SemigroupK<F> =>
  SemigroupK.of({ combineK_: (fa, fb) => F.combineK_(fb(), () => fa) });

const dualMonoidK = <F>(F: MonoidK<F>): MonoidK<F> =>
  MonoidK.of({ combineK_: dualSemigroupK(F).combineK_, emptyK: F.emptyK });

Dual.Semigroup = dualSemigroup;
Dual.Monoid = dualMonoid;
Dual.SemigroupK = dualSemigroupK;
Dual.MonoidK = dualMonoidK;

/**
 * @category Type Constructor
 * @category Data
 */
export interface DualF extends TyK<[unknown]> {
  [$type]: TyVar<this, 0>;
}
