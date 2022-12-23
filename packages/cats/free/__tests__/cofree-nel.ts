// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Arbitrary } from 'fast-check';
import { $, Eval } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { FunctionK } from '@fp4ts/cats-core';
import { List, ListF, OptionF, None, Some } from '@fp4ts/cats-core/lib/data';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

import { Cofree, CofreeF } from '@fp4ts/cats-free';

export type CofreeNel<A> = Cofree<OptionF, A>;
export type CofreeNelF = $<CofreeF, [OptionF]>;

export const cofNelToList: FunctionK<CofreeNelF, ListF> = cfr =>
  cfr.tail.value
    .map(cofNelToList)
    .getOrElse(() => List.empty)
    .cons(cfr.head);

export const nelToCofNel: FunctionK<ListF, CofreeNelF> = xs =>
  Cofree(
    xs.head,
    Eval.later(() => (xs.tail.isEmpty ? None : Some(nelToCofNel(xs.tail)))),
  );

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
  A.fp4tsList(arbA)
    .filter(xs => xs.nonEmpty)
    .map(nelToCofNel);
