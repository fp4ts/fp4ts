// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Proxy } from '@fp4ts/cats-core/lib/data';
import { Eq } from '@fp4ts/cats-kernel';
import {
  AlignSuite,
  AlternativeSuite,
  ContravariantSuite,
  MonadSuite,
} from '@fp4ts/cats-laws';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as ec from '@fp4ts/cats-test-kit/lib/exhaustive-check';

describe('Proxy', () => {
  checkAll(
    'Monad<Proxy>',
    MonadSuite(Proxy.Monad).monad(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      <X>() => fc.constant(Proxy<X>()),
      Proxy.EqK.liftEq,
    ),
  );

  checkAll(
    'Alternative<Proxy>',
    AlternativeSuite(Proxy.Alternative).alternative(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      <X>() => fc.constant(Proxy<X>()),
      Proxy.EqK.liftEq,
    ),
  );

  checkAll(
    'Contravariant<Proxy>',
    ContravariantSuite(Proxy.Contravariant).contravariant(
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      ec.miniInt(),
      ec.miniInt(),
      <X>() => fc.constant(Proxy<X>()),
      <X>() => Proxy.Eq<X>(),
    ),
  );

  checkAll(
    'Align<Proxy>',
    AlignSuite(Proxy.Align).align(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      <X>() => fc.constant(Proxy<X>()),
      Proxy.EqK.liftEq,
    ),
  );
});
