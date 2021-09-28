import fc from 'fast-check';
import { AdditionMonoid, Eq, Eval, EvalK, Hashable } from '@cats4ts/cats-core';
import { HashMap } from '@cats4ts/cats-core/lib/data';
import { checkAll } from '@cats4ts/cats-test-kit';
import * as A from '@cats4ts/cats-test-kit/lib/arbitraries';

import { MonoidKSuite } from '../disciplines/monoid-k-suite';
import { FunctorFilterSuite } from '../disciplines/functor-filter-suite';
import { UnorderedTraversableSuite } from '../disciplines/unordered-traversable-suite';

describe('HashMap laws', () => {
  const eqHashMapPrimPrim = HashMap.Eq(Eq.primitive, Eq.primitive);

  const monoidKTests = MonoidKSuite(HashMap.MonoidK(Hashable.primitiveMD5));
  checkAll(
    'MonoidK<HashMap>',
    monoidKTests.monoidK(
      A.cats4tsHashMap(fc.integer(), fc.integer(), Hashable.primitiveMD5),
      eqHashMapPrimPrim,
    ),
  );

  const functorFilterTests = FunctorFilterSuite(
    HashMap.FunctorFilter<number>(),
  );
  checkAll(
    'FunctorFilter<HashMap>',
    functorFilterTests.functorFilter(
      A.cats4tsHashMap(fc.integer(), fc.integer(), Hashable.primitiveMD5),
      A.cats4tsHashMap(
        fc.integer(),
        A.cats4tsOption(fc.integer()),
        Hashable.primitiveMD5,
      ),
      fc.integer(),
      fc.integer(),
      eqHashMapPrimPrim,
      eqHashMapPrimPrim,
      eqHashMapPrimPrim,
    ),
  );

  const unorderedTraversableTests = UnorderedTraversableSuite(
    HashMap.UnorderedTraversable<number>(),
  );
  checkAll(
    'UnorderedTraversable<HashMap>',
    unorderedTraversableTests.unorderedTraversable<
      number,
      number,
      number,
      EvalK,
      EvalK
    >(
      A.cats4tsHashMap(fc.integer(), fc.integer(), Hashable.primitiveMD5),
      A.cats4tsEval(fc.integer()),
      A.cats4tsEval(fc.integer()),
      A.cats4tsEval(fc.integer()),
      fc.integer(),
      AdditionMonoid,
      HashMap.Functor(),
      Eval.Applicative,
      Eval.Applicative,
      Eq.primitive,
      eqHashMapPrimPrim,
      Eval.Eq(Eval.Eq(eqHashMapPrimPrim)),
      Eval.Eq(eqHashMapPrimPrim),
      Eval.Eq(eqHashMapPrimPrim),
    ),
  );
});
