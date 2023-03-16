// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import {
  Applicative,
  ArrayF,
  EqK,
  Functor,
  Monad,
  Traversable,
} from '@fp4ts/cats-core';
import { Option, OptionF } from '@fp4ts/cats-core/lib/data';
import { Eq, Monoid } from '@fp4ts/cats-kernel';
import { ApplicativeSuite, TraversableSuite } from '@fp4ts/cats-laws';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import { EvalF } from '@fp4ts/core';

describe('Composed', () => {
  checkAll(
    'Applicative<[Option, Eval]>',
    ApplicativeSuite<[OptionF, EvalF]>(
      Applicative.compose(Option.Monad, Monad.Eval),
    ).applicative(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      X => A.fp4tsOption(A.fp4tsEval(X)),
      EqK.compose<OptionF, EvalF>(Option.EqK, EqK.Eval).liftEq,
    ),
  );

  checkAll(
    'Applicative<[Eval, Option]>',
    ApplicativeSuite<[EvalF, OptionF]>(
      Applicative.compose(Monad.Eval, Option.Monad),
    ).applicative(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      X => A.fp4tsEval(A.fp4tsOption(X)),
      EqK.compose<EvalF, OptionF>(EqK.Eval, Option.EqK).liftEq,
    ),
  );

  checkAll(
    'Traversable<[Option, Array]>',
    TraversableSuite<[OptionF, ArrayF]>(
      Traversable.compose(Option.TraversableFilter, Traversable.Array),
    ).traversable(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Monoid.addition,
      Monoid.addition,
      Functor.compose(Option.Monad, Functor.ArrayF),
      Monad.Eval,
      Monad.Eval,
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      X => A.fp4tsOption(fc.array(X)),
      EqK.compose<OptionF, ArrayF>(Option.EqK, EqK.Array).liftEq,
      A.fp4tsEval,
      Eq.Eval,
      A.fp4tsEval,
      Eq.Eval,
    ),
  );

  checkAll(
    'Traversable<[Array, Option]>',
    TraversableSuite<[ArrayF, OptionF]>(
      Traversable.compose(Traversable.Array, Option.TraversableFilter),
    ).traversable(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Monoid.addition,
      Monoid.addition,
      Functor.compose(Functor.ArrayF, Option.Monad),
      Monad.Eval,
      Monad.Eval,
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      X => fc.array(A.fp4tsOption(X)),
      EqK.compose<ArrayF, OptionF>(EqK.Array, Option.EqK).liftEq,
      A.fp4tsEval,
      Eq.Eval,
      A.fp4tsEval,
      Eq.Eval,
    ),
  );
});
