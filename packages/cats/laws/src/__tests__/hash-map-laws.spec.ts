import fc from 'fast-check';
import { AdditionMonoid, Eq, Eval, EvalK, Ord } from '@cats4ts/cats-core';
import { OrderedMap } from '@cats4ts/cats-core/lib/data';
import { checkAll } from '@cats4ts/cats-test-kit';
import * as A from '@cats4ts/cats-test-kit/lib/arbitraries';

import { MonoidKSuite } from '../disciplines/monoid-k-suite';
import { FunctorFilterSuite } from '../disciplines/functor-filter-suite';
import { TraversableSuite } from '../disciplines/traversable-suite';

describe('OrderedMap laws', () => {
  const eqOrderedMapPrimPrim = OrderedMap.Eq(Eq.primitive, Eq.primitive);

  const monoidKTests = MonoidKSuite(OrderedMap.MonoidK(Ord.primitive));
  checkAll(
    'MonoidK<OrderedMap>',
    monoidKTests.monoidK(
      A.cats4tsOrderedMap(fc.integer(), fc.integer(), Ord.primitive),
      eqOrderedMapPrimPrim,
    ),
  );

  const functorFilterTests = FunctorFilterSuite(
    OrderedMap.FunctorFilter<number>(),
  );
  checkAll(
    'FunctorFilter<OrderedMap>',
    functorFilterTests.functorFilter(
      A.cats4tsOrderedMap(fc.integer(), fc.integer(), Ord.primitive),
      A.cats4tsOrderedMap(
        fc.integer(),
        A.cats4tsOption(fc.integer()),
        Ord.primitive,
      ),
      fc.integer(),
      fc.integer(),
      eqOrderedMapPrimPrim,
      eqOrderedMapPrimPrim,
      eqOrderedMapPrimPrim,
    ),
  );

  const traversableTests = TraversableSuite(OrderedMap.Traversable<number>());
  checkAll(
    'Traversable<OrderedMap>',
    traversableTests.traversable<number, number, number, EvalK, EvalK>(
      A.cats4tsOrderedMap(fc.integer(), fc.integer(), Ord.primitive),
      A.cats4tsEval(fc.integer()),
      A.cats4tsEval(fc.integer()),
      A.cats4tsEval(fc.integer()),
      fc.integer(),
      fc.integer(),
      AdditionMonoid,
      AdditionMonoid,
      OrderedMap.Functor(),
      Eval.Applicative,
      Eval.Applicative,
      Eq.primitive,
      Eq.primitive,
      eqOrderedMapPrimPrim,
      eqOrderedMapPrimPrim,
      eqOrderedMapPrimPrim,
      Eval.Eq(Eval.Eq(eqOrderedMapPrimPrim)),
      Eval.Eq(eqOrderedMapPrimPrim),
      Eval.Eq(eqOrderedMapPrimPrim),
    ),
  );
});
