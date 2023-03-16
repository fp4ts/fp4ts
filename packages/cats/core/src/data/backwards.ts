// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { id, Kind } from '@fp4ts/core';
import { Functor } from '../functor';
import { Applicative } from '../applicative';
import { Monad } from '../monad';
import { Contravariant } from '../contravariant';
import { isDefer } from '../defer';
import { TraverseStrategy } from '../apply';

export type Backwards<F, A> = Kind<F, [A]>;

export const Backwards: BackwardsObj = function () {};

interface BackwardsObj {
  // -- Instances
  Functor<F>(F: Functor<F>): Functor<F>;
  Contravariant<F>(F: Contravariant<F>): Contravariant<F>;
  Applicative<F>(F: Applicative<F>): Applicative<F>;
  Monad<F>(F: Monad<F>): Monad<F>;
}

// -- Instances

Backwards.Functor = F => Functor.of({ map_: F.map_ });
Backwards.Contravariant = F => Contravariant.of({ contramap_: F.contramap_ });
Backwards.Applicative = <F>(F: Applicative<F>) => {
  const self = Applicative.of({
    ...Backwards.Functor(F),
    pure: F.pure,
    ap_: (ff, fa) => F.map2_(fa, ff, (a, f) => f(a)),
    map2_: (fa, fb, f) => F.map2_(fb, fa, (b, a) => f(a, b)),
    map2Eval_: (fa, efb, f) =>
      efb.map(fb => F.map2_(fb, fa, (b, a) => f(a, b))),
  });

  if (!isDefer(F)) {
    self.TraverseStrategy = use =>
      F.TraverseStrategy(Rhs =>
        use({
          defer: Rhs.defer,
          map: Rhs.map,
          map2: (fa, fb, f) => Rhs.map2(fb, fa, (b, a) => f(a, b)),
          toG: Rhs.toG,
          toRhs: Rhs.toRhs,
        }),
      );
  } else {
    const ts: TraverseStrategy<F, F> = {
      defer: F.defer,
      map: F.map_,
      map2: (fa, fb, f) => F.map2_(fb, fa, (b, a) => f(a, b)),
      toG: id,
      toRhs: F.defer,
    };
    self.TraverseStrategy = use => use(ts);
  }

  return self;
};
Backwards.Monad = <F>(F: Monad<F>) =>
  Monad.of({
    flatMap_: F.flatMap_,
    tailRecM_: F.tailRecM_,
    // override all applicative methods with inverted application
    ...Backwards.Applicative(F),
  });
