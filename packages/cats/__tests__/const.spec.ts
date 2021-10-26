import fc from 'fast-check';
import { AdditionMonoid, Eq, Eval } from '@fp4ts/cats-core';
import { Const } from '@fp4ts/cats-core/lib/data';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import {
  TraversableSuite,
  ApplicativeSuite,
  FunctorFilterSuite,
} from '@fp4ts/cats-laws';

describe('Const Laws', () => {
  const functorFilterTests = FunctorFilterSuite(Const.FunctorFilter<number>());
  checkAll(
    'Monad<Const>',
    functorFilterTests.functorFilter(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      x => x.map(Const.pure(AdditionMonoid)),
      () => Eq.primitive,
    ),
  );

  const applicativeTests = ApplicativeSuite(Const.Applicative(AdditionMonoid));
  checkAll(
    'Monad<Const>',
    applicativeTests.applicative(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      x => x.map(Const.pure(AdditionMonoid)),
      () => Eq.primitive,
    ),
  );

  const traversableTests = TraversableSuite(Const.Traversable(AdditionMonoid));
  checkAll(
    'Traversable<Const>',
    traversableTests.traversable(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      AdditionMonoid,
      AdditionMonoid,
      Const.Functor(),
      Eval.Applicative,
      Eval.Applicative,
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      x => x.map(Const.pure(AdditionMonoid)),
      () => Eq.primitive,
      A.fp4tsEval,
      Eval.Eq,
      A.fp4tsEval,
      Eval.Eq,
    ),
  );
});
