import fc from 'fast-check';
import { Eq } from '@cats4ts/cats-core';
import { Vector } from '@cats4ts/cats-core/lib/data';
import { checkAll } from '@cats4ts/cats-test-kit';
import * as A from '@cats4ts/cats-test-kit/lib/arbitraries';

import { AlternativeLaws } from '../alternative-laws';
import { AlternativeSuite } from '../disciplines/alternative-suite';
import { MonadSuite } from '../disciplines/monad-suite';
import { MonadLaws } from '../monad-laws';
import { FunctorFilterSuite } from '../disciplines/functor-filter-suite';
import { FunctorFilterLaws } from '../functor-filter-laws';

describe('Vector laws', () => {
  const eqVectorNumber: Eq<Vector<number>> = Eq.of({
    equals: (xs, ys) => xs.equals(ys),
  });

  const functorFilterTests = FunctorFilterSuite(
    FunctorFilterLaws(Vector.FunctorFilter),
  );
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

  const alternativeTests = AlternativeSuite(
    AlternativeLaws(Vector.Alternative),
  );
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

  const monadTests = MonadSuite(MonadLaws(Vector.Monad));
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
});
