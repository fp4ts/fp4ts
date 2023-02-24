// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Eval, id } from '@fp4ts/core';
import { Defer, Unzip } from '@fp4ts/cats-core';
import { Identity } from '@fp4ts/cats-core/lib/data';
import {
  Cochoice,
  Corepresentable,
  Costrong,
  Mapping,
  Representable,
} from '@fp4ts/cats-profunctor';
import {
  CochoiceSuite,
  CorepresentableSuite,
  MappingSuite,
  RepresentableSuite,
} from '@fp4ts/cats-profunctor-laws';
import { checkAll, ExhaustiveCheck, MiniInt } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as eq from '@fp4ts/cats-test-kit/lib/eq';

describe('Function1', () => {
  describe('Costrong', () => {
    test('fibonacci', () => {
      type T = [number, number, number];
      const fib = (n: number): number =>
        Costrong.Function1.unfirst(Defer.Function1<T>())<T, Eval<T>, T>(bd => [
          Eval.later(() => bd[1](bd[0])),
          ([n, f0, f1]) =>
            n === 0 ? [n, f0, f1] : bd[1]([n - 1, f1, f1 + f0]),
        ])([n, 0, 1]).value[1];

      expect(fib(40)).toBe(102334155);
    });
  });

  checkAll(
    'Mapping<* => *>',
    MappingSuite(Mapping.Function1).mapping(
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      ExhaustiveCheck.miniInt(),
      MiniInt.Eq,
      MiniInt.Eq,
      ExhaustiveCheck.miniInt(),
      MiniInt.Eq,
      ExhaustiveCheck.miniInt(),
      MiniInt.Eq,
      Identity.Traversable,
      <X, Y>(_: Arbitrary<X>, Y: Arbitrary<Y>) => fc.func<[X], Y>(Y),
      eq.fn1Eq,
      id,
      id,
    ),
  );

  checkAll(
    'Representable<* => *>',
    RepresentableSuite(Representable.Function1).representable(
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      ExhaustiveCheck.miniInt(),
      MiniInt.Eq,
      MiniInt.Eq,
      ExhaustiveCheck.miniInt(),
      MiniInt.Eq,
      ExhaustiveCheck.miniInt(),
      MiniInt.Eq,
      <X, Y>(_: Arbitrary<X>, Y: Arbitrary<Y>) => fc.func<[X], Y>(Y),
      eq.fn1Eq,
      id,
      id,
    ),
  );

  checkAll(
    'Corepresentable<* => *>',
    CorepresentableSuite(Corepresentable.Function1).corepresentable(
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      ExhaustiveCheck.miniInt(),
      MiniInt.Eq,
      ExhaustiveCheck.miniInt(),
      MiniInt.Eq,
      <X, Y>(_: Arbitrary<X>, Y: Arbitrary<Y>) => fc.func<[X], Y>(Y),
      eq.fn1Eq,
      id,
      { ...Defer.Eval, ...Unzip.Eval },
      A.fp4tsEval,
    ),
  );

  checkAll(
    'Cochoice<* => *>',
    CochoiceSuite(Cochoice.Function1).cochoice(
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      ExhaustiveCheck.miniInt(),
      MiniInt.Eq,
      ExhaustiveCheck.miniInt(),
      MiniInt.Eq,
      <X, Y>(_: Arbitrary<X>, Y: Arbitrary<Y>) => fc.func<[X], Y>(Y),
      eq.fn1Eq,
    ),
  );
});
