import fc from 'fast-check';
import { Eq } from '@cats4ts/cats-core';
import { List } from '@cats4ts/cats-core/lib/data';
import { checkAll } from '@cats4ts/cats-test-kit';
import * as A from '@cats4ts/cats-test-kit/lib/arbitraries';

import { AlternativeLaws } from '../alternative-laws';
import { AlternativeSuite } from '../disciplines/alternative-suite';
import { MonadSuite } from '../disciplines/monad-suite';
import { MonadLaws } from '../monad-laws';
import { FunctorFilterSuite } from '../disciplines/functor-filter-suite';
import { FunctorFilterLaws } from '../functor-filter-laws';

describe('List laws', () => {
  const eqListNumber: Eq<List<number>> = Eq.of({
    equals: (xs, ys) => xs.equals(Eq.primitive, ys),
  });

  const functorFilterTests = FunctorFilterSuite(
    FunctorFilterLaws(List.FunctorFilter),
  );
  checkAll(
    'FunctorFilter<List>',
    functorFilterTests.functorFilter(
      A.cats4tsList(fc.integer()),
      A.cats4tsList(A.cats4tsOption(fc.integer())),
      fc.integer(),
      fc.integer(),
      eqListNumber,
      eqListNumber,
      eqListNumber,
    ),
  );

  const alternativeTests = AlternativeSuite(AlternativeLaws(List.Alternative));
  checkAll(
    'Alternative<List>',
    alternativeTests.alternative(
      A.cats4tsList(fc.integer()),
      A.cats4tsList(fc.integer()),
      A.cats4tsList(fc.integer()),
      A.cats4tsList(fc.func<[number], number>(fc.integer())),
      A.cats4tsList(fc.func<[number], number>(fc.integer())),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      eqListNumber,
      eqListNumber,
      eqListNumber,
    ),
  );

  const monadTests = MonadSuite(MonadLaws(List.Monad));
  checkAll(
    'Monad<List>',
    monadTests.monad(
      A.cats4tsList(fc.integer()),
      A.cats4tsList(fc.integer()),
      A.cats4tsList(fc.integer()),
      A.cats4tsList(fc.integer()),
      A.cats4tsList(fc.func<[number], number>(fc.integer())),
      A.cats4tsList(fc.func<[number], number>(fc.integer())),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      eqListNumber,
      eqListNumber,
      eqListNumber,
      eqListNumber,
    ),
  );
});
