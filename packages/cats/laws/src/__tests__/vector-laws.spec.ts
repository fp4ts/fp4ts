import fc from 'fast-check';
import { AdditionMonoid, Eq, Eval, EvalK } from '@cats4ts/cats-core';
import { Vector } from '@cats4ts/cats-core/lib/data';
import { checkAll } from '@cats4ts/cats-test-kit';
import * as A from '@cats4ts/cats-test-kit/lib/arbitraries';

import { AlternativeSuite } from '../disciplines/alternative-suite';
import { MonadSuite } from '../disciplines/monad-suite';
import { FunctorFilterSuite } from '../disciplines/functor-filter-suite';
import { UnorderedTraversableSuite } from '../disciplines/unordered-traversable-suite';
import { FoldableSuite } from '../disciplines/foldable-suite';

describe('Vector laws', () => {
  const eqVectorNumber: Eq<Vector<number>> = Eq.of({
    equals: (xs, ys) => xs.equals(ys),
  });

  const functorFilterTests = FunctorFilterSuite(Vector.FunctorFilter);
  checkAll(
    'FunctorFilter<Vector>',
    functorFilterTests.functorFilter(
      A.cats4tsVector(fc.integer()),
      A.cats4tsVector(A.cats4tsOption(fc.integer())),
      fc.integer(),
      fc.integer(),
      eqVectorNumber,
      eqVectorNumber,
      eqVectorNumber,
    ),
  );

  const alternativeTests = AlternativeSuite(Vector.Alternative);
  checkAll(
    'Alternative<Vector>',
    alternativeTests.alternative(
      A.cats4tsVector(fc.integer()),
      A.cats4tsVector(fc.integer()),
      A.cats4tsVector(fc.integer()),
      A.cats4tsVector(fc.func<[number], number>(fc.integer())),
      A.cats4tsVector(fc.func<[number], number>(fc.integer())),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      eqVectorNumber,
      eqVectorNumber,
      eqVectorNumber,
    ),
  );

  const monadTests = MonadSuite(Vector.Monad);
  checkAll(
    'Monad<Vector>',
    monadTests.monad(
      A.cats4tsVector(fc.integer()),
      A.cats4tsVector(fc.integer()),
      A.cats4tsVector(fc.integer()),
      A.cats4tsVector(fc.integer()),
      A.cats4tsVector(fc.func<[number], number>(fc.integer())),
      A.cats4tsVector(fc.func<[number], number>(fc.integer())),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      eqVectorNumber,
      eqVectorNumber,
      eqVectorNumber,
      eqVectorNumber,
    ),
  );

  const unorderedTraversableTests = UnorderedTraversableSuite(
    Vector.Traversable,
  );
  checkAll(
    'UnorderedTraversable<Vector>',
    unorderedTraversableTests.unorderedTraversable<
      number,
      number,
      number,
      EvalK,
      EvalK
    >(
      A.cats4tsVector(fc.integer()),
      A.cats4tsEval(fc.integer()),
      A.cats4tsEval(fc.integer()),
      A.cats4tsEval(fc.integer()),
      fc.integer(),
      AdditionMonoid,
      Vector.Functor,
      Eval.Applicative,
      Eval.Applicative,
      Eq.primitive,
      eqVectorNumber,
      Eval.Eq(Eval.Eq(eqVectorNumber)),
      Eval.Eq(eqVectorNumber),
      Eval.Eq(eqVectorNumber),
    ),
  );

  const foldableTests = FoldableSuite(Vector.Foldable);
  checkAll(
    'Foldable<Vector>',
    foldableTests.foldable(
      A.cats4tsVector(fc.integer()),
      fc.integer(),
      AdditionMonoid,
      AdditionMonoid,
      Eq.primitive,
      Eq.primitive,
    ),
  );
});
