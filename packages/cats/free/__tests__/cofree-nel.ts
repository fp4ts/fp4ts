// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { $, Eval } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { ArrayF, FunctionK } from '@fp4ts/cats-core';
import { OptionF, None, Some } from '@fp4ts/cats-core/lib/data';

import { Cofree, CofreeF } from '@fp4ts/cats-free';

export type CofreeNel<A> = Cofree<OptionF, A>;
export type CofreeNelF = $<CofreeF, [OptionF]>;

export const cofNelToArray: FunctionK<CofreeNelF, ArrayF> = cfr => [
  cfr.head,
  ...cfr.tail.value.map(cofNelToArray).getOrElse(() => []),
];

export const nelToCofNel: FunctionK<ArrayF, CofreeNelF> = <A>(xs: A[]) => {
  const sz = xs.length;
  const go = (idx: number): Cofree<OptionF, A> =>
    Cofree(
      xs[idx],
      Eval.later(() => (idx + 1 >= sz ? None : Some(go(idx + 1)))),
    );
  return go(0);
};

export const eqCofreeNel = <A>(EqA: Eq<A>): Eq<CofreeNel<A>> =>
  Eq.of({
    equals: (l, r) => {
      while (true) {
        const lt = l.tail.value;
        const rt = r.tail.value;
        if (lt.isEmpty && rt.isEmpty) return EqA.equals(l.head, r.head);
        if (lt.nonEmpty && rt.nonEmpty && EqA.equals(l.head, r.head)) {
          l = lt.get;
          r = rt.get;
          continue;
        }
        return false;
      }
    },
  });

export const cofreeOptionArb = <A>(
  arbA: Arbitrary<A>,
): Arbitrary<Cofree<OptionF, A>> =>
  fc.array(arbA, { minLength: 1 }).map(nelToCofNel);
