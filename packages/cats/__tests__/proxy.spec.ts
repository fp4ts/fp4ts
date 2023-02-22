// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Proxy } from '@fp4ts/cats-core/lib/data';
import { Eq, Monoid } from '@fp4ts/cats-kernel';
import {
  AlternativeSuite,
  ContravariantSuite,
  DeferSuite,
  MonadSuite,
  OrdSuite,
  TraversableFilterSuite,
  UnalignSuite,
  UnzipSuite,
} from '@fp4ts/cats-laws';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as ec from '@fp4ts/cats-test-kit/lib/exhaustive-check';
import { Monad } from '@fp4ts/cats-core';

describe('Proxy', () => {
  checkAll(
    'Ord<Proxy<any>>',
    OrdSuite(Proxy.Ord<any>()).ord(fc.constant(Proxy<any>())),
  );

  checkAll(
    'Defer<Proxy>',
    DeferSuite(Proxy.Defer).defer(
      fc.integer(),
      Eq.fromUniversalEquals(),
      <X>() => fc.constant(Proxy<X>()),
      Proxy.EqK.liftEq,
    ),
  );

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
    'Unalign<Proxy>',
    UnalignSuite(Proxy.Unalign).unalign(
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
    'Unzip<Proxy>',
    UnzipSuite(Proxy.Unzip).unzip(
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
    'TraversableFilter<Proxy>',
    TraversableFilterSuite(Proxy.TraversableFilter).traversableFilter(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Monoid.addition,
      Monoid.addition,
      Proxy.TraversableFilter,
      Monad.Eval,
      Monad.Eval,
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      <X>() => fc.constant(Proxy<X>()),
      Proxy.EqK.liftEq,
      A.fp4tsEval,
      Eq.Eval,
      A.fp4tsEval,
      Eq.Eval,
    ),
  );
});
