// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { ApplicativeDefer } from '@fp4ts/cats-core';
import { IsEq } from '@fp4ts/cats-test-kit';

import { ApplicativeLaws } from './applicative-laws';
import { DeferLaws } from './defer-laws';

export const ApplicativeDeferLaws = <F>(F: ApplicativeDefer<F>) => ({
  ...ApplicativeLaws(F),
  ...DeferLaws(F),

  applicativeDeferDelayIsPure: <A>(a: A) =>
    new IsEq(
      F.delay(() => a),
      F.pure(a),
    ),

  applicativeDeferDelayDoesNotEvaluate: (): boolean => {
    let evaluated = false;
    const delayed = F.delay(() => {
      evaluated = true;
    });
    return evaluated === false;
  },

  applicativeDeferMapIsLazy: <A>(fa: Kind<F, [A]>): boolean => {
    let evaluated = false;
    F.map_(fa, _ => {
      evaluated = true;
    });
    return evaluated === false;
  },

  applicativeDeferMapStackSafety: (): IsEq<Kind<F, [number]>> => {
    let fa = F.pure(0);
    const size = 50_000;
    for (let i = 0; i < size; i++) {
      fa = F.map_(fa, x => x + 1);
    }
    return new IsEq(fa, F.pure(size));
  },
});
