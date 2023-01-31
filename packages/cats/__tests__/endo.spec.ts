// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { id } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { MonoidKSuite } from '@fp4ts/cats-laws';
import { checkAll, MiniInt } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as E from '@fp4ts/cats-test-kit/lib/eq';
import * as ec from '@fp4ts/cats-test-kit/lib/exhaustive-check';
import { Foldable, MonoidK } from '@fp4ts/cats-core';

describe('Endo', () => {
  it('should apply composition of endo', () => {
    const computation = MonoidK.Endo.combineK_(
      (s: string) => `Hello, ${s}`,
      (s: string) => `${s}!`,
    );

    expect(computation('fp4ts')).toEqual('Hello, fp4ts!');
  });

  it('should be stack safe on combine', () => {
    const increment = (x: number): number => x + 1;
    const xs: ((n: number) => number)[] = [...new Array(50_000)].map(
      () => increment,
    );

    const sumAll = Foldable.Array.foldMap_(MonoidK.Endo.algebra<number>())(
      xs,
      id,
    );
    sumAll(1);
  });

  describe('Laws', () => {
    checkAll(
      'MonoidK<Endo<*>>>',
      MonoidKSuite(MonoidK.Endo).monoidK(
        A.fp4tsMiniInt(),
        MiniInt.Eq,
        A.fp4tsEndo,
        // @ts-expect-error
        <X>(EX: Eq<X>) => E.fn1Eq(ec.miniInt(), EX),
      ),
    );
  });
});
