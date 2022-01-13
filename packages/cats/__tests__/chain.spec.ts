// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Eq, Monoid, Eval } from '@fp4ts/cats-core';
import { Chain, Option } from '@fp4ts/cats-core/lib/data';
import {
  AlignSuite,
  AlternativeSuite,
  FunctorFilterSuite,
  MonadSuite,
  TraversableSuite,
} from '@fp4ts/cats-laws';
import { checkAll, forAll, IsEq } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

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
      A.fp4tsVector(fc.integer()),
      xs => new IsEq(Chain.fromVector(xs).headOption, xs.headOption),
    )(Option.Eq(Eq.primitive)),
  );

  test(
    'lastOption',
    forAll(
      A.fp4tsVector(fc.integer()),
      xs => new IsEq(Chain.fromVector(xs).lastOption, xs.lastOption),
    )(Option.Eq(Eq.primitive)),
  );

  test(
    'size to be consistent with toList.size',
    forAll(A.fp4tsChain(fc.integer()), c => c.size === c.toList.size),
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
        A.fp4tsChain,
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
        A.fp4tsChain,
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
        A.fp4tsChain,
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
        A.fp4tsChain,
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
        Monoid.addition,
        Monoid.addition,
        Chain.Monad,
        Eval.Applicative,
        Eval.Applicative,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        A.fp4tsChain,
        Chain.Eq,
        A.fp4tsEval,
        Eval.Eq,
        A.fp4tsEval,
        Eval.Eq,
      ),
    );
  });
});
