// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Eq, Monoid } from '@fp4ts/cats-kernel';
import { Monad } from '@fp4ts/cats-core';
import { Seq } from '@fp4ts/cats-core/lib/data';
import { MonadSuite, TraversableFilterSuite } from '@fp4ts/cats-laws';
import { checkAll, forAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

describe('Seq', () => {
  test(
    'concat to be List.concat',
    forAll(A.fp4tsSeq(fc.integer()), A.fp4tsSeq(fc.integer()), (xs, ys) =>
      expect(xs['++'](ys).toArray).toEqual(xs.toList.concat(ys.toList).toArray),
    ),
  );

  test(
    'toList identity',
    forAll(A.fp4tsList(fc.integer()), xs =>
      expect(Seq.fromList(xs).toList).toEqual(xs),
    ),
  );

  test(
    'toArray identity',
    forAll(fc.array(fc.integer()), xs =>
      expect(Seq.fromArray(xs).toArray).toEqual(xs),
    ),
  );

  test(
    'equals to be List.equals',
    forAll(
      A.fp4tsSeq(fc.integer()),
      A.fp4tsSeq(fc.integer()),
      (xs, ys) => xs.equals(ys) === xs.toList.equals(ys.toList),
    ),
  );

  describe('Laws', () => {
    checkAll(
      'Monad<Seq>',
      MonadSuite(Seq.Monad).monad(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        A.fp4tsSeq,
        Seq.Eq,
      ),
    );

    checkAll(
      'TraversableFilter<Seq>',
      TraversableFilterSuite(Seq.TraversableFilter).traversableFilter(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Monoid.addition,
        Monoid.addition,
        Seq.TraversableFilter,
        Monad.Eval,
        Monad.Eval,
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        A.fp4tsSeq,
        Seq.EqK.liftEq,
        A.fp4tsEval,
        Eq.Eval,
        A.fp4tsEval,
        Eq.Eval,
      ),
    );
  });
});
