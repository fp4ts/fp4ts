// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Cokleisli, IdentityF } from '@fp4ts/cats-core/lib/data';
import { MonadDeferSuite } from '@fp4ts/cats-laws';
import {
  checkAll,
  ExhaustiveCheck,
  fn1Eq,
  MiniInt,
} from '@fp4ts/cats-test-kit';
import * as ec from '@fp4ts/cats-test-kit/lib/exhaustive-check';

describe('Cokleisli', () => {
  describe('Laws', () => {
    const eqCokleisli = <F, A, B>(
      EFA: ExhaustiveCheck<Kind<F, [A]>>,
      EqB: Eq<B>,
    ): Eq<Cokleisli<F, A, B>> => fn1Eq(EFA, EqB);

    checkAll(
      'MonadDefer<Cokleisli<Identity, MiniInt, *>>',
      MonadDeferSuite(Cokleisli.MonadDefer<IdentityF, MiniInt>()).monadDefer(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        <X>(X: Arbitrary<X>) => fc.func<[MiniInt], X>(X),
        <X>(X: Eq<X>) => eqCokleisli(ec.miniInt(), X),
      ),
    );
  });
});
