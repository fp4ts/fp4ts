// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { newtypeK, KindOf, Kind, TyK, $type, TyVar, $, id } from '@fp4ts/core';
import { Functor } from '../functor';
import { Applicative } from '../applicative';
import { Monad } from '../monad';
import { IdentityF } from './identity';
import { Contravariant } from '../contravariant';

const _Backwards = newtypeK<IdentityF>()('@fp4ts/cats/core/data/backwards');
type _BackwardsF = KindOf<typeof _Backwards>;

export type Backwards<F, A> = Kind<_BackwardsF, [Kind<F, [A]>]>;

export const Backwards: BackwardsObj = function (a) {
  return _Backwards(a);
};

interface BackwardsObj {
  <F, A>(a: Kind<F, [A]>): Backwards<F, A>;
  getBackwards<F, A>(bfa: Backwards<F, A>): Kind<F, [A]>;

  // -- Instances
  Functor<F>(F: Functor<F>): Functor<$<BackwardsF, [F]>>;
  Contravariant<F>(F: Contravariant<F>): Contravariant<$<BackwardsF, [F]>>;
  Applicative<F>(F: Applicative<F>): Applicative<$<BackwardsF, [F]>>;
  Monad<F>(F: Monad<F>): Monad<$<BackwardsF, [F]>>;
}

Backwards.getBackwards = _Backwards.unapply;

// -- Instances

Backwards.Functor = F => Functor.of({ map_: F.map_ as any });
Backwards.Contravariant = F =>
  Contravariant.of({ contramap_: F.contramap_ as any });
Backwards.Applicative = F =>
  Applicative.of({
    ...Backwards.Functor(F),
    pure: a => Backwards(F.pure(a)),
    ap_: (ff, fa) =>
      Backwards(
        F.map2_(
          Backwards.getBackwards(fa),
          Backwards.getBackwards(ff),
        )((a, f) => f(a)),
      ),
  });
Backwards.Monad = <F>(F: Monad<F>) =>
  Monad.of({
    ...(F as any),
    // override all applicative methods with inverted application
    ...Backwards.Applicative(F),
  });

// -- HKT

export interface BackwardsF extends TyK<[unknown, unknown]> {
  [$type]: Backwards<TyVar<this, 0>, TyVar<this, 1>>;
}
