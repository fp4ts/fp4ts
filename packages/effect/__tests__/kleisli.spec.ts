// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import '@fp4ts/effect-test-kit/lib/jest-extension';
import fc, { Arbitrary } from 'fast-check';
import { Eq } from '@fp4ts/cats';
import { Async, Outcome } from '@fp4ts/effect-kernel';
import { IO, IOF } from '@fp4ts/effect-core';
import { AsyncSuite } from '@fp4ts/effect-laws';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as ec from '@fp4ts/cats-test-kit/lib/exhaustive-check';
import * as eq from '@fp4ts/effect-test-kit/lib/eq';
import * as A from '@fp4ts/effect-test-kit/lib/arbitraries';

describe.ticked('Kleisli', ticker => {
  checkAll(
    'Async<Kleisli<IO, MiniInt, *>>',
    AsyncSuite(Async.asyncForKleisli<IOF, boolean, Error>(IO.Async)).async(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      ticker.ctx,
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Outcome.Eq(
        Eq.Error.strict,
        eq.fn1Eq(ec.boolean(), eq.eqIO(Eq.fromUniversalEquals(), ticker)),
      ),
      <X>(X: Arbitrary<X>) => fc.func<[boolean], IO<X>>(A.fp4tsIO(X)),
      <X>(X: Eq<X>) => eq.fn1Eq(ec.boolean(), eq.eqIO(X, ticker)),
    ),
  );
});
