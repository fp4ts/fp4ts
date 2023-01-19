// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { id } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Endo, Array as CArray } from '@fp4ts/cats-core/lib/data';
import { MonoidKSuite } from '@fp4ts/cats-laws';
import { checkAll, MiniInt } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as E from '@fp4ts/cats-test-kit/lib/eq';
import * as ec from '@fp4ts/cats-test-kit/lib/exhaustive-check';

describe('Endo', () => {
  it('should apply composition of endo', () => {
    const computation = Endo.MonoidK.combineK_(
      (s: string) => `Hello, ${s}`,
      (s: string) => `${s}!`,
    );

    expect(computation('fp4ts')).toEqual('Hello, fp4ts!');
  });

  it('should be stack safe on combine', () => {
    const increment = (x: number): number => x + 1;
    const xs: Endo<number>[] = [...new Array(50_000)].map(() => increment);

    const sumAll = CArray.FoldableWithIndex().foldMap_(
      Endo.MonoidK.algebra<number>(),
    )(xs, id);
    sumAll(1);
  });

  describe('Laws', () => {
    const monoidKTests = MonoidKSuite(Endo.MonoidK);

    checkAll(
      'MonoidK<Endo<*>>>',
      monoidKTests.monoidK(
        A.fp4tsMiniInt(),
        MiniInt.Eq,
        A.fp4tsEndo,
        // @ts-expect-error
        <X>(EX: Eq<X>) => E.fn1Eq(ec.miniInt(), EX),
      ),
    );
  });
});
