// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Eq } from '@fp4ts/cats-kernel';
import { Distributive, Monad, Traversable } from '@fp4ts/cats-core';
import { DistributiveSuite, MonadDeferSuite } from '@fp4ts/cats-laws';
import { checkAll } from '@fp4ts/cats-test-kit';

describe('Function0', () => {
  checkAll(
    'Distributive<() => *>',
    DistributiveSuite(Distributive.Function0).distributive(
      fc.string(),
      fc.string(),
      fc.string(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      <X>(X: Arbitrary<X>) => X.map(x => () => x),
      <X>(X: Eq<X>) => Eq.by(X, (fx: () => X) => fx()),
    ),
  );

  // checkAll(
  //   'Comonad<() => *>',
  //   ComonadSuite(Comonad.Function0).comonad(
  //     fc.integer(),
  //     fc.integer(),
  //     fc.integer(),
  //     fc.integer(),
  //     Eq.fromUniversalEquals(),
  //     Eq.fromUniversalEquals(),
  //     Eq.fromUniversalEquals(),
  //     Eq.fromUniversalEquals(),
  //     <X>(X: Arbitrary<X>) => X.map(x => () => x),
  //     <X>(X: Eq<X>) => Eq.by(X, (fx: () => X) => fx()),
  //   ),
  // );

  checkAll(
    'MonadDefer<() => *>',
    MonadDeferSuite(Monad.Function0).monadDefer(
      fc.string(),
      fc.string(),
      fc.string(),
      fc.string(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      <X>(X: Arbitrary<X>) => X.map(x => () => x),
      <X>(X: Eq<X>) => Eq.by(X, (fx: () => X) => fx()),
    ),
  );

  it('should be stack safe on traverse', () => {
    const xs = [...Array(1_000_000)];
    expect(
      Traversable.Array.traverse_(Monad.Function0)(xs, x => () => x)(),
    ).toEqual(xs);
  });
});
