import fc from 'fast-check';
import '@cats4ts/cats-core/lib/data/collections/array/array';
import { Eq, Eval, EvalK, AdditionMonoid } from '@cats4ts/cats-core';
import {
  AlignSuite,
  AlternativeSuite,
  FunctorFilterSuite,
  MonadSuite,
  TraversableSuite,
} from '@cats4ts/cats-laws';
import { checkAll } from '@cats4ts/cats-test-kit';
import * as A from '@cats4ts/cats-test-kit/lib/arbitraries';

describe('Array laws', () => {
  const alignTests = AlignSuite(Array.Align);
  checkAll(
    'Align<Vector>',
    alignTests.align(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      fc.array,
      Array.Eq,
    ),
  );

  const functorFilterTests = FunctorFilterSuite(Array.FunctorFilter);
  checkAll(
    'FunctorFilter<Vector>',
    functorFilterTests.functorFilter(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      fc.array,
      Array.Eq,
    ),
  );

  const alternativeTests = AlternativeSuite(Array.Alternative);
  checkAll(
    'Alternative<Vector>',
    alternativeTests.alternative(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      fc.array,
      Array.Eq,
    ),
  );

  const monadTests = MonadSuite(Array.Monad);
  checkAll(
    'Monad<Vector>',
    monadTests.monad(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      fc.array,
      Array.Eq,
    ),
  );

  const traversableTests = TraversableSuite(Array.Traversable);
  checkAll(
    'Traversable<Vector>',
    traversableTests.traversable<number, number, number, EvalK, EvalK>(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      AdditionMonoid,
      AdditionMonoid,
      Array.Functor,
      Eval.Applicative,
      Eval.Applicative,
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      fc.array,
      Array.Eq,
      A.cats4tsEval,
      Eval.Eq,
      A.cats4tsEval,
      Eval.Eq,
    ),
  );
});
