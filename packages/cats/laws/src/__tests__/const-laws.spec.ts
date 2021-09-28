import fc from 'fast-check';
import { AdditionMonoid, Eq, Eval } from '@cats4ts/cats-core';
import { Const, Option } from '@cats4ts/cats-core/lib/data';
import { checkAll } from '@cats4ts/cats-test-kit';
import * as A from '@cats4ts/cats-test-kit/lib/arbitraries';

import { TraversableSuite } from '../disciplines/traversable-suite';
import { ApplicativeSuite } from '../disciplines/applicative-suite';
import { FunctorFilterSuite } from '../disciplines/functor-filter-suite';

describe('Const Laws', () => {
  const eqContPrim: Eq<Const<number, number>> = Eq.primitive;

  const functorFilterTests = FunctorFilterSuite(Const.FunctorFilter<number>());
  checkAll(
    'Monad<Const>',
    functorFilterTests.functorFilter(
      fc.integer(),
      fc
        .func<[number], Option<number>>(A.cats4tsOption(fc.integer()))
        .map(Const.pure(AdditionMonoid)),
      fc.integer(),
      fc.integer(),
      eqContPrim,
      eqContPrim,
      eqContPrim,
    ),
  );

  const applicativeTests = ApplicativeSuite(Const.Applicative(AdditionMonoid));
  checkAll(
    'Monad<Const>',
    applicativeTests.applicative(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.func<[number], number>(fc.integer()).map(Const.pure(AdditionMonoid)),
      fc.func<[number], number>(fc.integer()).map(Const.pure(AdditionMonoid)),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      eqContPrim,
      eqContPrim,
      eqContPrim,
    ),
  );

  const traversableTests = TraversableSuite(Const.Traversable(AdditionMonoid));
  checkAll(
    'Traversable<Const>',
    traversableTests.traversable(
      fc.integer(),
      A.cats4tsEval(fc.integer()),
      A.cats4tsEval(fc.integer()),
      A.cats4tsEval(fc.integer()),
      fc.integer(),
      fc.integer(),
      AdditionMonoid,
      AdditionMonoid,
      Const.Functor(),
      Eval.Applicative,
      Eval.Applicative,
      Eq.primitive,
      Eq.primitive,
      eqContPrim,
      eqContPrim,
      eqContPrim,
      Eval.Eq(Eval.Eq(eqContPrim)),
      Eval.Eq(eqContPrim),
      Eval.Eq(eqContPrim),
    ),
  );
});
