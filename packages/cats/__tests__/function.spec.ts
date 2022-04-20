// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Function1 } from '@fp4ts/cats-core/lib/data';
import { Eq } from '@fp4ts/cats-kernel';
import { MonadSuite } from '@fp4ts/cats-laws';
import { checkAll, MiniInt } from '@fp4ts/cats-test-kit';
import * as ec from '@fp4ts/cats-test-kit/lib/exhaustive-check';
import * as eq from '@fp4ts/cats-test-kit/lib/eq';

describe('Function1', () => {
  const monadTests = MonadSuite(Function1.Monad<MiniInt>());
  checkAll(
    'Monad<Function1<number, *>>',
    monadTests.monad(
      fc.string(),
      fc.string(),
      fc.string(),
      fc.string(),
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      <X>(arbX: Arbitrary<X>) => fc.func<[MiniInt], X>(arbX),
      <X>(EqX: Eq<X>) => eq.fn1Eq(ec.miniInt(), EqX),
    ),
  );
});
