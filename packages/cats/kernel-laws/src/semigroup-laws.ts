// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Semigroup } from '@fp4ts/cats-kernel';
import { IsEq } from '@fp4ts/cats-test-kit';
import { Eval } from '@fp4ts/core';

export const SemigroupLaws = <A>(S: Semigroup<A>) => ({
  semigroupAssociativity: (x: A, y: A, z: A): IsEq<A> =>
    new IsEq(S.combine_(S.combine_(x, y), z), S.combine_(x, S.combine_(y, z))),

  semigroupDualReverses: (x: A, y: A): IsEq<A> =>
    new IsEq(S.dual().combine_(x, y), S.combine_(y, x)),

  semigroupDualDualIsIdentity: (x: A, y: A): IsEq<A> =>
    new IsEq(S.dual().dual().combine_(x, y), S.combine_(x, y)),

  semigroupCombineEvalStackSafety: (x: A): IsEq<A> => {
    const n = 20_000;
    const go = (idx: number): Eval<A> =>
      idx >= n
        ? Eval.now(x)
        : S.combineEval_(
            x,
            Eval.defer(() => go(idx + 1)),
          );

    return new IsEq(go(1).value, S.combineN_(x, n));
  },
});
