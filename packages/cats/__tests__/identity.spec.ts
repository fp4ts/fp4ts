import fc from 'fast-check';
import { PrimitiveType } from '@cats4ts/core';
import { AdditionMonoid, Eq, Eval } from '@cats4ts/cats-core';
import { Identity } from '@cats4ts/cats-core/lib/data';
import { checkAll } from '@cats4ts/cats-test-kit';
import * as A from '@cats4ts/cats-test-kit/lib/arbitraries';
import { MonadSuite, TraversableSuite } from '@cats4ts/cats-laws';

describe('Identity Laws', () => {
  const eqIdPrim: Eq<Identity<PrimitiveType>> = Eq.primitive;

  const monadTests = MonadSuite(Identity.Monad);
  checkAll(
    'Monad<Identity>',
    monadTests.monad(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.func<[number], number>(fc.integer()),
      fc.func<[number], number>(fc.integer()),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      eqIdPrim,
      eqIdPrim,
      eqIdPrim,
      eqIdPrim,
    ),
  );

  const traversableTests = TraversableSuite(Identity.Traversable);
  checkAll(
    'Traversable<Identity>',
    traversableTests.traversable(
      fc.integer(),
      A.cats4tsEval(fc.integer()),
      A.cats4tsEval(fc.integer()),
      A.cats4tsEval(fc.integer()),
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
      eqIdPrim,
      eqIdPrim,
      eqIdPrim,
      Eval.Eq(Eval.Eq(eqIdPrim)),
      Eval.Eq(eqIdPrim),
      Eval.Eq(eqIdPrim),
    ),
  );
});
