// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eval, Kind } from '@fp4ts/core';
import { Applicative, ApplicativeRequirements } from './applicative';
import { MonoidK, MonoidKRequirements } from './monoid-k';
import { ArrayF, arrayAlternative } from './instances/array';
import * as A from './internal/array-helpers';

/**
 * @category Type Class
 */
export interface Alternative<F> extends Applicative<F>, MonoidK<F> {
  many<A>(fa: Kind<F, [A]>): Kind<F, [A[]]>;
  many1<A>(fa: Kind<F, [A]>): Kind<F, [A[]]>;
}

export type AlternativeRequirements<F> = ApplicativeRequirements<F> &
  MonoidKRequirements<F> &
  Partial<Alternative<F>>;
export const Alternative = Object.freeze({
  of: <F>(F: AlternativeRequirements<F>): Alternative<F> => {
    const self: Alternative<F> = {
      many: <A>(fa: Kind<F, [A]>): Kind<F, [A[]]> => {
        const many: Eval<Kind<F, [A.Cons<A>]>> = Eval.defer(() => many1).map(
          self.combineK(self.pure({ tag: 0 } as A.Cons<A>)),
        );
        const many1: Eval<Kind<F, [A.Cons<A>]>> = self.map2Eval_(
          fa,
          many,
          A.cons,
        );

        return self.map_(many.value, A.consToArray);
      },

      many1: <A>(fa: Kind<F, [A]>): Kind<F, [A[]]> => {
        const many: Eval<Kind<F, [A.Cons<A>]>> = Eval.defer(() => many1).map(
          self.combineK(self.pure({ tag: 0 } as A.Cons<A>)),
        );
        const many1: Eval<Kind<F, [A.Cons<A>]>> = self.map2Eval_(
          fa,
          many,
          A.cons,
        );

        return self.map_(many1.value, A.consToArray);
      },

      ...MonoidK.of(F),
      ...Applicative.of(F),
      ...F,
    };
    return self;
  },

  get Array(): Alternative<ArrayF> {
    return arrayAlternative();
  },
});
