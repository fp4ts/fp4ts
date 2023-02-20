// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Eval, throwError } from '@fp4ts/core';
import { Eq, Monoid, Semigroup } from '@fp4ts/cats-kernel';
import { Option, Either, Left, Right, Ior } from '@fp4ts/cats-core/lib/data';
import { checkAll, forAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import { BifunctorSuite, MonadErrorSuite } from '@fp4ts/cats-laws';

describe('Ior', () => {
  test(
    'left Option is nonEmpty on left and both',
    forAll(
      A.fp4tsIor(fc.integer(), fc.string()),
      ior => (ior.isLeft || ior.isBoth) === ior.left.nonEmpty,
    ),
  );

  test(
    'right Option is nonEmpty on right and both',
    forAll(
      A.fp4tsIor(fc.integer(), fc.string()),
      ior => (ior.isRight || ior.isBoth) === ior.right.nonEmpty,
    ),
  );

  test(
    'only left or right',
    forAll(A.fp4tsIor(fc.integer(), fc.string()), i =>
      i.onlyLeft
        .map<Either<number, string>>(Left)
        ['<|>'](() => i.onlyRight.map(Right))
        ['<=>'](i.onlyLeftOrRight),
    )(Option.Eq(Either.Eq(Eq.fromUniversalEquals(), Eq.fromUniversalEquals()))),
  );

  test(
    'onlyBoth consistent with left and right',
    forAll(A.fp4tsIor(fc.integer(), fc.string()), i =>
      i.onlyBoth['<=>'](
        i.left.flatMap(l => i.right.map(r => [l, r] as [number, string])),
      ),
    )(Option.Eq(Eq.tuple(Eq.fromUniversalEquals(), Eq.fromUniversalEquals()))),
  );

  test(
    'pad consistent with left and right tuple',
    forAll(A.fp4tsIor(fc.integer(), fc.string()), i =>
      i.pad['<=>']([i.left, i.right] as [Option<number>, Option<string>]),
    )(
      Eq.tuple(
        Option.Eq(Eq.fromUniversalEquals()),
        Option.Eq(Eq.fromUniversalEquals()),
      ),
    ),
  );

  test(
    'combine left',
    forAll(
      A.fp4tsIor(fc.integer(), fc.string()),
      A.fp4tsIor(fc.integer(), fc.string()),
      (i, j) =>
        i
          .combine(
            Semigroup.addition,
            Semigroup.string,
          )(j)
          .left['<=>'](
            i.left.map(x => x + j.left.getOrElse(() => 0)).orElse(() => j.left),
          ),
    )(Option.Eq(Eq.fromUniversalEquals())),
  );

  test(
    'merge',
    forAll(
      A.fp4tsIor(fc.integer(), fc.integer()),
      i =>
        i.merge(Semigroup.addition) ===
        i.left.getOrElse(() => 0) + i.right.getOrElse(() => 0),
    ),
  );

  test(
    'mergeWith',
    forAll(
      A.fp4tsIor(fc.integer(), fc.integer()),
      fc.func<[number, number], number>(fc.integer()),
      (i, f) =>
        i.mergeWith(f) ===
        i.onlyBoth
          .map(([l, r]) => f(l, r))
          ['<|>'](() => i.left)
          ['<|>'](() => i.right).get,
    ),
  );

  test(
    'combine right',
    forAll(
      A.fp4tsIor(fc.integer(), fc.string()),
      A.fp4tsIor(fc.integer(), fc.string()),
      (i, j) =>
        i
          .combine(
            Semigroup.addition,
            Semigroup.string,
          )(j)
          .right['<=>'](
            i.right
              .map(x => x + j.right.getOrElse(() => ''))
              .orElse(() => j.right),
          ),
    )(Option.Eq(Eq.fromUniversalEquals())),
  );

  test(
    'toEither consistent with right',
    forAll(A.fp4tsIor(fc.integer(), fc.string()), i =>
      i.toEither.toOption['<=>'](i.right),
    )(Option.Eq(Eq.fromUniversalEquals())),
  );

  it('should short-circuit on Error', () => {
    expect(
      Ior.Monad<string>(Monoid.string).map2Eval_(
        Ior.Left('42'),
        Eval.delay(() => throwError(new Error('err 2'))),
        () => 42,
      ).value,
    ).toEqual(Ior.Left('42'));
  });

  describe('Laws', () => {
    const bifunctorTests = BifunctorSuite(Ior.Bifunctor);
    checkAll(
      'Bifunctor<Iok>',
      bifunctorTests.bifunctor(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        A.fp4tsIor,
        Ior.Eq,
      ),
    );

    const monadTests = MonadErrorSuite(Ior.MonadError(Semigroup.string));
    checkAll(
      'MonadError<IorK<string, *>, string>',
      monadTests.monadError(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.string(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        arbX => A.fp4tsIor(fc.string(), arbX),
        EqX => Ior.Eq(Eq.fromUniversalEquals(), EqX),
      ),
    );
  });
});
