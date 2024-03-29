// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Base, Eval, instance, Kind, lazy } from '@fp4ts/core';
import { Semigroup } from '@fp4ts/cats-kernel';

/**
 * @category Type Class
 */
export interface SemigroupK<F> extends Base<F> {
  combineK<A>(y: Kind<F, [A]>): (x: Kind<F, [A]>) => Kind<F, [A]>;
  combineK_<A>(x: Kind<F, [A]>, y: Kind<F, [A]>): Kind<F, [A]>;

  combineKEval<A>(
    ey: Eval<Kind<F, [A]>>,
  ): (x: Kind<F, [A]>) => Eval<Kind<F, [A]>>;
  combineKEval_<A>(x: Kind<F, [A]>, ey: Eval<Kind<F, [A]>>): Eval<Kind<F, [A]>>;

  combineNK(n: number): <A>(fa: Kind<F, [A]>) => Kind<F, [A]>;
  combineNK_<A>(fa: Kind<F, [A]>, n: number): Kind<F, [A]>;

  algebra<A>(): Semigroup<Kind<F, [A]>>;

  dual(): SemigroupK<F>;
}

export type SemigroupKRequirements<F> = Pick<SemigroupK<F>, 'combineK_'> &
  Partial<SemigroupK<F>>;
export const SemigroupK = Object.freeze({
  of: <F>(F: SemigroupKRequirements<F>): SemigroupK<F> => {
    const self: SemigroupK<F> = instance<SemigroupK<F>>({
      combineK: y => x => F.combineK_(x, y),

      combineKEval: ey => x => self.combineKEval_(x, ey),
      combineKEval_: (x, ey) => ey.map(y => F.combineK_(x, y)),

      combineNK: n => x => self.combineNK_(x, n),
      combineNK_: (x, n) => {
        if (n <= 0) throw new Error('Semigroup.combineN: n has to be > 0');
        return n === 1 ? x : combineNK(self, x, n - 1);
      },

      algebra: lazy(<A>() =>
        Semigroup.of<Kind<F, [A]>>({
          combine: F.combineK ?? (y => x => F.combineK_(x, y)),
          combine_: F.combineK_,
          combineEval_: F.combineKEval_,
          combineN: F.combineNK,
          combineN_: F.combineNK_,
        }),
      ) as <A>() => Semigroup<Kind<F, [A]>>,

      dual: lazy(() =>
        SemigroupK.of<F>({
          dual: () => self,
          combineK_: (x, y) => self.combineK_(y, x),
        }),
      ),
      ...F,
    });
    return self;
  },
});

function combineNK<F, A>(
  S: SemigroupK<F>,
  fa: Kind<F, [A]>,
  n: number,
): Kind<F, [A]> {
  const r: Eval<Kind<F, [A]>> = Eval.defer(() =>
    n-- < 1 ? Eval.now(fa) : S.combineKEval_(fa, r),
  );
  return r.value;
}
