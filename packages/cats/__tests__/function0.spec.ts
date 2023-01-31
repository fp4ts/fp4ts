// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Eq } from '@fp4ts/cats-kernel';
import { Comonad, Defer, Distributive, Monad } from '@fp4ts/cats-core';
import { List } from '@fp4ts/cats-core/lib/data';
import {
  ComonadSuite,
  DeferSuite,
  DistributiveSuite,
  MonadSuite,
} from '@fp4ts/cats-laws';
import { checkAll } from '@fp4ts/cats-test-kit';

describe('Function0', () => {
  checkAll(
    'Defer<() => *>',
    DeferSuite(Defer.Function0).defer(
      fc.integer(),
      Eq.fromUniversalEquals(),
      <X>(X: Arbitrary<X>) => X.map(x => () => x),
      <X>(X: Eq<X>) => Eq.by(X, (fx: () => X) => fx()),
    ),
  );

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
    'Monad<() => *>',
    MonadSuite(Monad.Function0).monad(
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
    const xs = List.range(0, 1_000_000);
    expect(xs.traverse(Monad.Function0, x => () => x)().toArray).toEqual(
      xs.toArray,
    );
  });
});
