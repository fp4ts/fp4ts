// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eval, Kind } from '@fp4ts/core';
import { SemigroupK } from '@fp4ts/cats-core';
import { IsEq } from '@fp4ts/cats-test-kit';

export const SemigroupKLaws = <F>(F: SemigroupK<F>) => ({
  semigroupKAssociative: <A>(
    a: Kind<F, [A]>,
    b: Kind<F, [A]>,
    c: Kind<F, [A]>,
  ): IsEq<Kind<F, [A]>> =>
    new IsEq(
      F.combineK_(F.combineK_(a, b), c),
      F.combineK_(a, F.combineK_(b, c)),
    ),

  semigroupKCombineEvalStackSafety: <A>(
    fa: Kind<F, [A]>,
  ): IsEq<Kind<F, [A]>> => {
    const n = 20_000;
    const go = (idx: number): Eval<Kind<F, [A]>> =>
      idx >= n
        ? Eval.now(fa)
        : F.combineKEval_(
            fa,
            Eval.defer(() => go(idx + 1)),
          );
    return new IsEq(go(1).value, F.combineNK_(fa, n));
  },
});
