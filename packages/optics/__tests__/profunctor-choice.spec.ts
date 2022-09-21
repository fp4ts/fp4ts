// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Eq, Tagged } from '@fp4ts/cats';
import { Choice } from '@fp4ts/optics-kernel';
import { checkAll, ExhaustiveCheck, MiniInt } from '@fp4ts/cats-test-kit';
import { ChoiceSuite } from '@fp4ts/optics-laws';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as ec from '@fp4ts/cats-test-kit/lib/exhaustive-check';

describe('Choice', () => {
  checkAll(
    'Choice<Tagged>',
    ChoiceSuite(Choice.Tagged).choice(
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      fc.boolean(),
      fc.boolean(),
      fc.integer(),
      ec.miniInt(),
      MiniInt.Eq,
      Eq.fromUniversalEquals(),
      ec.boolean(),
      ec.boolean(),
      Eq.fromUniversalEquals(),
      <X, Y>(X: Arbitrary<X>, Y: Arbitrary<Y>) => A.fp4tsTagged<X>()<Y>(Y),
      <X, Y>(X: ExhaustiveCheck<X>, Y: Eq<Y>) => Tagged.EqK<X>().liftEq(Y),
    ),
  );
});
