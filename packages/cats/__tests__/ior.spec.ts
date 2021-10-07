import fc from 'fast-check';
import { Eq, Semigroup } from '@cats4ts/cats-core';
import { Option, Either, Left, Right, Ior } from '@cats4ts/cats-core/lib/data';
import { checkAll, forAll } from '@cats4ts/cats-test-kit';
import * as A from '@cats4ts/cats-test-kit/lib/arbitraries';
import { MonadSuite } from '@cats4ts/cats-laws';

describe('Ior', () => {
  test(
    'left Option is nonEmpty on left and both',
    forAll(
      A.cats4tsIor(fc.integer(), fc.string()),
      ior => (ior.isLeft || ior.isBoth) === ior.left.nonEmpty,
    ),
  );

  test(
    'right Option is nonEmpty on right and both',
    forAll(
      A.cats4tsIor(fc.integer(), fc.string()),
      ior => (ior.isRight || ior.isBoth) === ior.right.nonEmpty,
    ),
  );

  test(
    'only left or right',
    forAll(A.cats4tsIor(fc.integer(), fc.string()), i =>
      i.onlyLeft
        .map<Either<number, string>>(Left)
        ['<|>'](() => i.onlyRight.map(Right))
        ['<=>'](i.onlyLeftOrRight),
    )(Option.Eq(Either.Eq(Eq.primitive, Eq.primitive))),
  );

  test(
    'onlyBoth consistent with left and right',
    forAll(A.cats4tsIor(fc.integer(), fc.string()), i =>
      i.onlyBoth['<=>'](
        i.left.flatMap(l => i.right.map(r => [l, r] as [number, string])),
      ),
    )(Option.Eq(Eq.tuple2(Eq.primitive, Eq.primitive))),
  );

  test(
    'pad consistent with left and right tuple',
    forAll(A.cats4tsIor(fc.integer(), fc.string()), i =>
      i.pad['<=>']([i.left, i.right] as [Option<number>, Option<string>]),
    )(Eq.tuple2(Option.Eq(Eq.primitive), Option.Eq(Eq.primitive))),
  );

  test(
    'combine left',
    forAll(
      A.cats4tsIor(fc.integer(), fc.string()),
      A.cats4tsIor(fc.integer(), fc.string()),
      (i, j) =>
        i
          .combine(
            Semigroup.addition,
            Semigroup.string,
          )(j)
          .left['<=>'](
            i.left.map(x => x + j.left.getOrElse(() => 0)).orElse(() => j.left),
          ),
    )(Option.Eq(Eq.primitive)),
  );

  test(
    'combine right',
    forAll(
      A.cats4tsIor(fc.integer(), fc.string()),
      A.cats4tsIor(fc.integer(), fc.string()),
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
    )(Option.Eq(Eq.primitive)),
  );

  test(
    'toEither consistent with right',
    forAll(A.cats4tsIor(fc.integer(), fc.string()), i =>
      i.toEither.toOption['<=>'](i.right),
    )(Option.Eq(Eq.primitive)),
  );

  const monadTests = MonadSuite(Ior.Monad(Semigroup.addition));
  checkAll(
    'Monad<$<IorK, [number]>>',
    monadTests.monad(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      arbX => A.cats4tsIor(fc.integer(), arbX),
      EqX => Ior.Eq(Eq.primitive, EqX),
    ),
  );
});
