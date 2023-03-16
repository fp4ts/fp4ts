// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Defer } from '@fp4ts/cats-core';
import { IsEq } from '@fp4ts/cats-test-kit';

export const DeferLaws = <F>(F: Defer<F>) => ({
  deferIdentity: <A>(ffa: () => Kind<F, [A]>): IsEq<Kind<F, [A]>> =>
    new IsEq(
      F.defer(() => ffa()),
      ffa(),
    ),

  deferDoesNotEvaluate: <A>(ffa: () => Kind<F, [A]>): IsEq<boolean> => {
    let evaluated = false;
    const deferFA = F.defer(() => {
      evaluated = true;
      return ffa();
    });
    return new IsEq(evaluated, false);
  },

  deferIsStackSafe: <A>(ffa: () => Kind<F, [A]>): IsEq<Kind<F, [A]>> => {
    const loop = (n: number): Kind<F, [A]> =>
      n <= 0 ? F.defer(() => ffa()) : F.defer(() => loop(n - 1));

    return new IsEq(loop(10_000), ffa());
  },

  // deferMatchesFix: <A>(ffa: () => Kind<F, [A]>): IsEq<Kind<F, [A]>> =>
  //   new IsEq(
  //     F.defer(() => ffa()),
  //     F.fix(() => ffa()),
  //   ),
});
