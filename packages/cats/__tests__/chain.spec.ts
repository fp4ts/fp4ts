import fc from 'fast-check';
import { Eq, AdditionMonoid, Eval } from '@cats4ts/cats-core';
import { Chain, Option } from '@cats4ts/cats-core/lib/data';
import {
  AlignSuite,
  AlternativeSuite,
  FunctorFilterSuite,
  MonadSuite,
  TraversableSuite,
} from '@cats4ts/cats-laws';
import { checkAll, forAll, IsEq } from '@cats4ts/cats-test-kit';
import * as A from '@cats4ts/cats-test-kit/lib/arbitraries';

describe('Chain', () => {
  describe('types', () => {
    it('should be covariant', () => {
      const c: Chain<number> = Chain.empty;
    });

    it('should not allow for unrelated type widening', () => {
      const c: Chain<number> = Chain.empty;

      // @ts-expect-error
      c.append('string');
    });
  });

  test(
    'headOption',
    forAll(
      A.cats4tsVector(fc.integer()),
      xs => new IsEq(Chain.fromVector(xs).headOption, xs.headOption),
    )(Option.Eq(Eq.primitive)),
  );

  test(
    'lastOption',
    forAll(
      A.cats4tsVector(fc.integer()),
      xs => new IsEq(Chain.fromVector(xs).lastOption, xs.lastOption),
    )(Option.Eq(Eq.primitive)),
  );

  test(
    'size to be consistent with toList.size',
    forAll(A.cats4tsChain(fc.integer()), c => c.size === c.toList.size),
  );

  it('should do something', () => {
    expect(Chain(1, 2, 3)['+++'](Chain(4, 5)).toArray).toEqual([1, 2, 3, 4, 5]);
  });

  describe('Laws', () => {
    const alignTests = AlignSuite(Chain.Align);
    checkAll(
      'Align<ChainK>',
      alignTests.align(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        A.cats4tsChain,
        Chain.Eq,
      ),
    );

    const functorFilterTests = FunctorFilterSuite(Chain.FunctorFilter);
    checkAll(
      'FunctorFiler<ChainK>',
      functorFilterTests.functorFilter(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        A.cats4tsChain,
        Chain.Eq,
      ),
    );

    const alternativeTests = AlternativeSuite(Chain.Alternative);
    checkAll(
      'Alternative<ChainK>',
      alternativeTests.alternative(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        A.cats4tsChain,
        Chain.Eq,
      ),
    );

    const monadTests = MonadSuite(Chain.Monad);
    checkAll(
      'Monad<ChainK>',
      monadTests.monad(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        A.cats4tsChain,
        Chain.Eq,
      ),
    );

    const traversableTests = TraversableSuite(Chain.Traversable);
    checkAll(
      'Traversable<ChainK>',
      traversableTests.traversable(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        AdditionMonoid,
        AdditionMonoid,
        Chain.Monad,
        Eval.Applicative,
        Eval.Applicative,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        A.cats4tsChain,
        Chain.Eq,
        A.cats4tsEval,
        Eval.Eq,
        A.cats4tsEval,
        Eval.Eq,
      ),
    );
  });
});
