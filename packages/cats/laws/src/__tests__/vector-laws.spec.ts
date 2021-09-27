import fc from 'fast-check';
import { AdditionMonoid, Eq, Eval, EvalK } from '@cats4ts/cats-core';
import { Vector } from '@cats4ts/cats-core/lib/data';
import { checkAll } from '@cats4ts/cats-test-kit';
import * as A from '@cats4ts/cats-test-kit/lib/arbitraries';

import { AlternativeSuite } from '../disciplines/alternative-suite';
import { MonadSuite } from '../disciplines/monad-suite';
import { TraversableSuite } from '../disciplines/traversable-suite';

describe('Vector laws', () => {
  const eqVectorNumber: Eq<Vector<number>> = Eq.of({
    equals: (xs, ys) => xs.equals(ys),
  });

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

  const traversableTests = TraversableSuite(Vector.Traversable);
  checkAll(
    'Traversable<Vector>',
    traversableTests.traversable<number, number, number, EvalK, EvalK>(
      A.cats4tsVector(fc.integer()),
      A.cats4tsEval(fc.integer()),
      A.cats4tsEval(fc.integer()),
      A.cats4tsEval(fc.integer()),
      fc.integer(),
      fc.integer(),
      AdditionMonoid,
      AdditionMonoid,
      Vector.Functor,
      Eval.Applicative,
      Eval.Applicative,
      Eq.primitive,
      Eq.primitive,
      eqVectorNumber,
      eqVectorNumber,
      eqVectorNumber,
      Eval.Eq(Eval.Eq(eqVectorNumber)),
      Eval.Eq(eqVectorNumber),
      Eval.Eq(eqVectorNumber),
    ),
  );
});
