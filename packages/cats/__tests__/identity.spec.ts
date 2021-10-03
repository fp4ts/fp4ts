import fc from 'fast-check';
import { id } from '@cats4ts/core';
import { AdditionMonoid, Eq, Eval } from '@cats4ts/cats-core';
import { Identity } from '@cats4ts/cats-core/lib/data';
import { checkAll } from '@cats4ts/cats-test-kit';
import * as A from '@cats4ts/cats-test-kit/lib/arbitraries';
import { MonadSuite, TraversableSuite } from '@cats4ts/cats-laws';

describe('Identity Laws', () => {
  const monadTests = MonadSuite(Identity.Monad);
  checkAll(
    'Monad<Identity>',
    monadTests.monad(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      id,
      id,
    ),
  );

  const traversableTests = TraversableSuite(Identity.Traversable);
  checkAll(
    'Traversable<Identity>',
    traversableTests.traversable(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      AdditionMonoid,
      AdditionMonoid,
      Identity.Functor,
      Eval.Applicative,
      Eval.Applicative,
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      id,
      id,
      A.cats4tsEval,
      Eval.Eq,
      A.cats4tsEval,
      Eval.Eq,
    ),
  );
});
