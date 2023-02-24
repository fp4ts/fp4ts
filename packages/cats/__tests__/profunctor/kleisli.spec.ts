// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Eval, id } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Comonad, Defer, Monad, MonadDefer, Unzip } from '@fp4ts/cats-core';
import { Identity, IdentityF } from '@fp4ts/cats-core/lib/data';
import {
  Cochoice,
  Costrong,
  Mapping,
  Representable,
} from '@fp4ts/cats-profunctor';
import {
  CochoiceSuite,
  CostrongSuite,
  MappingSuite,
  RepresentableSuite,
} from '@fp4ts/cats-profunctor-laws';
import { checkAll, MiniInt } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as eq from '@fp4ts/cats-test-kit/lib/eq';
import * as ec from '@fp4ts/cats-test-kit/lib/exhaustive-check';

describe('Kleisli', () => {
  describe('Costrong', () => {
    test('fibonacci', () => {
      type T = [number, number, number];
      const fib = (n: number): Eval<number> =>
        Costrong.Kleisli({ ...MonadDefer.Eval, ...Comonad.Eval })
          .unfirst(Defer.Function1<T>())<T, Eval<T>, T>(bd =>
            Eval.later(() => [
              Eval.later(() => bd[1](bd[0])),
              ([n, f0, f1]) =>
                n === 0 ? [n, f0, f1] : bd[1]([n - 1, f1, f1 + f0]),
            ]),
          )([n, 0, 1])
          .value.map(([, x]) => x);

      expect(fib(40).value).toBe(102334155);
    });
  });

  checkAll(
    'Mapping<* => Identity<*>>',
    MappingSuite(
      Mapping.Kleisli<IdentityF>({
        ...Identity.Monad,
        ...Identity.Distributive,
      }),
    ).mapping(
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      ec.miniInt(),
      MiniInt.Eq,
      MiniInt.Eq,
      ec.miniInt(),
      MiniInt.Eq,
      ec.miniInt(),
      MiniInt.Eq,
      Identity.Traversable,
      <X, Y>(_: Arbitrary<X>, Y: Arbitrary<Y>) => fc.func<[X], Y>(Y),
      eq.fn1Eq,
      id,
      id,
    ),
  );

  checkAll(
    'Representable<* => Eval<*>>',
    RepresentableSuite(Representable.Kleisli(Monad.Eval)).representable(
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      ec.miniInt(),
      MiniInt.Eq,
      MiniInt.Eq,
      ec.miniInt(),
      MiniInt.Eq,
      ec.miniInt(),
      MiniInt.Eq,
      <X, Y>(_: Arbitrary<X>, Y: Arbitrary<Y>) =>
        fc.func<[X], Eval<Y>>(A.fp4tsEval(Y)),
      (X, Y) => eq.fn1Eq(X, Eq.Eval(Y)),
      A.fp4tsEval,
      Eq.Eval,
    ),
  );

  checkAll(
    'Cochoice<* => Eval<*>>',
    CochoiceSuite(Cochoice.Kleisli(Identity.Traversable)).cochoice(
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      ec.miniInt(),
      MiniInt.Eq,
      ec.miniInt(),
      MiniInt.Eq,
      <X, Y>(_: Arbitrary<X>, Y: Arbitrary<Y>) => fc.func<[X], Y>(Y),
      (X, Y) => eq.fn1Eq(X, Y),
    ),
  );

  checkAll(
    'Costrong<* => Eval<*>>',
    CostrongSuite(
      Costrong.Kleisli({ ...MonadDefer.Eval, ...Comonad.Eval }),
    ).costrong(
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      ec.miniInt(),
      MiniInt.Eq,
      ec.miniInt(),
      MiniInt.Eq,
      <X, Y>(_: Arbitrary<X>, Y: Arbitrary<Y>) =>
        fc.func<[X], Eval<Y>>(A.fp4tsEval(Y)),
      (X, Y) => eq.fn1Eq(X, Eq.Eval(Y)),
      { ...Defer.Eval, ...Unzip.Eval },
      A.fp4tsEval,
    ),
  );
});
