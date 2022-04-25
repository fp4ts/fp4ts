// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  Kind,
  KindOf,
  Lazy,
  lazyVal,
  newtypeK,
  newtypeKDerive,
} from '@fp4ts/core';
import { Monoid, Semigroup } from '@fp4ts/cats-kernel';
import { Monad, MonadF } from '../monad';
import { Traversable, TraversableF } from '../traversable';
import { Identity, IdentityF } from './identity';
import { EqK, EqKF } from '../eq-k';

const Dual_ = newtypeK<IdentityF>()('@fp4ts/cats/core/data/dual');

export type Dual<A> = Kind<DualF, [A]>;
export const Dual: DualObj = function <A>(a: A) {
  return Dual_(a);
} as any;

interface DualObj {
  <A>(a: A): Dual<A>;
  getDual<A>(fa: Dual<A>): A;

  // -- Instances

  Semigroup<A>(S: Semigroup<A>): Semigroup<Dual<A>>;
  Monoid<A>(S: Monoid<A>): Monoid<Dual<A>>;

  EqK: EqK<DualF>;
  Monad: Monad<DualF>;
  Traversable: Traversable<DualF>;
}

Dual.getDual = Dual_.unapply;

// -- Instances

const dualSemigroup = <A>(S: Semigroup<A>): Semigroup<Dual<A>> =>
  Semigroup.of({
    combine_: (a, b) =>
      Dual(S.combine_(Dual.getDual(b()), () => Dual.getDual(a))),
  });

const dualMonoid = <A>(M: Monoid<A>): Monoid<Dual<A>> =>
  Monoid.of({ ...dualSemigroup(M), empty: Dual(M.empty) });

const dualEqK: Lazy<EqK<DualF>> = lazyVal(() =>
  newtypeKDerive<EqKF>()(Dual_, Identity.EqK),
);
const dualMonad: Lazy<Monad<DualF>> = lazyVal(() =>
  newtypeKDerive<MonadF>()(Dual_, Identity.Monad),
);
const dualTraversable: Lazy<Traversable<DualF>> = lazyVal(() =>
  newtypeKDerive<TraversableF>()(Dual_, Identity.Traversable),
);

Dual.Semigroup = dualSemigroup;
Dual.Monoid = dualMonoid;
Object.defineProperty(Dual, 'EqK', {
  get() {
    return dualEqK();
  },
});
Object.defineProperty(Dual, 'Monad', {
  get() {
    return dualMonad();
  },
});
Object.defineProperty(Dual, 'Traversable', {
  get() {
    return dualTraversable();
  },
});

// -- HKT

export type DualF = KindOf<typeof Dual_>;
