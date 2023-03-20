// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { cached, Kind } from '@fp4ts/core';
import { Functor } from '../functor';
import { Applicative } from '../applicative';
import { Monad } from '../monad';
import { Contravariant } from '../contravariant';

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
Backwards.Applicative = cached(<F>(F: Applicative<F>) =>
  Applicative.of({
    ...Backwards.Functor(F),
    pure: F.pure,
    ap_: (ff, fa) => F.map2_(fa, ff, (a, f) => f(a)),
    map2_: (fa, fb, f) => F.map2_(fb, fa, (b, a) => f(a, b)),
    map2Eval_: (fa, efb, f) =>
      efb.map(fb => F.map2_(fb, fa, (b, a) => f(a, b))),

    TraverseStrategy: use =>
      F.TraverseStrategy(T =>
        use({
          defer: T.defer,
          map: T.map,
          map2: (fa, fb, f) => T.map2(fb, fa, (b, a) => f(a, b)),
          toG: T.toG,
          toRhs: T.toRhs,
          cosequenceEval: T.cosequenceEval,
        }),
      ),
  }),
);

Backwards.Monad = cached(<F>(F: Monad<F>) =>
  Monad.of({
    flatMap_: F.flatMap_,
    tailRecM_: F.tailRecM_,
    // override all applicative methods with inverted application
    ...Backwards.Applicative(F),
  }),
);
