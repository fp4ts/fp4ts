// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Eval } from '@fp4ts/cats-core';
import { Tuple2 } from '@fp4ts/cats-core/lib/data';
import { Eq, CommutativeMonoid } from '@fp4ts/cats-kernel';
import {
  BifunctorSuite,
  ComonadSuite,
  TraversableSuite,
} from '@fp4ts/cats-laws';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

describe('Tuple2', () => {
  checkAll(
    'Bifunctor<Tuple2>',
    BifunctorSuite(Tuple2.Bifunctor).bifunctor(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      fc.tuple,
      Eq.tuple,
    ),
  );

  checkAll(
    'Comonad<[number, *]>',
    ComonadSuite(Tuple2.right.Comonad<number>()).comonad(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      x => fc.tuple(fc.integer(), x),
      x => Eq.tuple(Eq.fromUniversalEquals(), x),
    ),
  );

  checkAll(
    'Traversable<[number, *]>',
    TraversableSuite(Tuple2.right.Traversable<number>()).traversable(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      CommutativeMonoid.addition,
      CommutativeMonoid.addition,
      Tuple2.Bifunctor.rightFunctor<number>(),
      Eval.Applicative,
      Eval.Applicative,
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      x => fc.tuple(fc.integer(), x),
      x => Eq.tuple(Eq.fromUniversalEquals(), x),
      A.fp4tsEval,
      Eval.Eq,
      A.fp4tsEval,
      Eval.Eq,
    ),
  );

  checkAll(
    'Comonad<[*, number]>',
    ComonadSuite(Tuple2.left.Comonad<number>()).comonad(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      x => fc.tuple(x, fc.integer()),
      x => Eq.tuple(x, Eq.fromUniversalEquals()),
    ),
  );

  checkAll(
    'Traversable<[*, number]>',
    TraversableSuite(Tuple2.left.Traversable<number>()).traversable(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      CommutativeMonoid.addition,
      CommutativeMonoid.addition,
      Tuple2.Bifunctor.leftFunctor<number>(),
      Eval.Applicative,
      Eval.Applicative,
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      x => fc.tuple(x, fc.integer()),
      x => Eq.tuple(x, Eq.fromUniversalEquals()),
      A.fp4tsEval,
      Eval.Eq,
      A.fp4tsEval,
      Eval.Eq,
    ),
  );
});
