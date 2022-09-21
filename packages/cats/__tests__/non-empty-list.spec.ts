// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Eq, CommutativeMonoid } from '@fp4ts/cats-kernel';
import { Eval } from '@fp4ts/cats-core';
import {
  List,
  Option,
  None,
  NonEmptyList as Nel,
  Some,
  Vector,
  Either,
} from '@fp4ts/cats-core/lib/data';
import {
  AlignSuite,
  CoflatMapSuite,
  MonadSuite,
  SemigroupKSuite,
  TraversableSuite,
} from '@fp4ts/cats-laws';
import { checkAll, forAll, IsEq } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

describe('NonEmptyList', () => {
  describe('construction', () => {
    it('should create a Nel from enumerated values', () => {
      expect(Nel.of(1, 2, 3, 4, 5)).toEqual(Nel(1, List(2, 3, 4, 5)));
    });

    it('should return None when created from an empty list', () => {
      expect(Nel.fromList(List.empty)).toEqual(None);
    });

    it('should create a Nel from a singleton list', () => {
      expect(Nel.fromList(List(42))).toEqual(Some(Nel(42, List.empty)));
    });

    it('should return None when created from an empty Vector', () => {
      expect(Nel.fromVector(Vector.empty)).toEqual(None);
    });

    it('should return None when created from a non-empty Vector', () => {
      expect(Nel.fromVector(Vector(1, 2, 3))).toEqual(Some(Nel(1, List(2, 3))));
    });

    it('should return None when created from an empty Array', () => {
      expect(Nel.fromArray([])).toEqual(None);
    });

    it('should return None when created from a non-empty Array', () => {
      expect(Nel.fromArray([1, 2, 3])).toEqual(Some(Nel(1, List(2, 3))));
    });
  });

  test(
    'reverse to be evq toList.reverse',
    forAll(
      A.fp4tsNel(fc.integer()),
      nel => new IsEq(nel.reverse.toList, nel.toList.reverse),
    )(List.Eq(Eq.fromUniversalEquals())),
  );

  test(
    'prepend to be evq toList.prepend',
    forAll(
      A.fp4tsNel(fc.integer()),
      fc.integer(),
      (nel, x) => new IsEq(nel.prepend(x).toList, nel.toList.prepend(x)),
    )(List.Eq(Eq.fromUniversalEquals())),
  );

  test(
    'append to be evq toList.append',
    forAll(
      A.fp4tsNel(fc.integer()),
      fc.integer(),
      (nel, x) => new IsEq(nel.append(x).toList, nel.toList.append(x)),
    )(List.Eq(Eq.fromUniversalEquals())),
  );

  test(
    'concat to be evq toList.concat',
    forAll(
      A.fp4tsNel(fc.integer()),
      A.fp4tsList(fc.integer()),
      (nel, ys) => new IsEq(nel['+++'](ys).toList, nel.toList['+++'](ys)),
    )(List.Eq(Eq.fromUniversalEquals())),
  );

  test(
    'concatNel to be evq toList.concat',
    forAll(
      A.fp4tsNel(fc.integer()),
      A.fp4tsNel(fc.integer()),
      (nel, ys) =>
        new IsEq(nel.concatNel(ys).toList, nel.toList['+++'](ys.toList)),
    )(List.Eq(Eq.fromUniversalEquals())),
  );

  test(
    'elemOption to be evq toList.elemOption',
    forAll(
      A.fp4tsNel(fc.integer()),
      fc.integer(),
      (nel, idx) => new IsEq(nel.elemOption(idx), nel.toList.elemOption(idx)),
    )(Option.Eq(Eq.fromUniversalEquals())),
  );

  test(
    'all to be evq toList.all',
    forAll(
      A.fp4tsNel(fc.integer()),
      fc.func<[number], boolean>(fc.boolean()),
      (nel, f) => nel.all(f) === nel.toList.all(f),
    ),
  );

  test(
    'any to be evq toList.any',
    forAll(
      A.fp4tsNel(fc.integer()),
      fc.func<[number], boolean>(fc.boolean()),
      (nel, f) => nel.any(f) === nel.toList.any(f),
    ),
  );

  test(
    'count to be evq toList.count',
    forAll(
      A.fp4tsNel(fc.integer()),
      fc.func<[number], boolean>(fc.boolean()),
      (nel, f) => nel.count(f) === nel.toList.count(f),
    ),
  );

  test(
    'take to be evq toList.take',
    forAll(
      A.fp4tsNel(fc.integer()),
      fc.integer(),
      (nel, n) => new IsEq(nel.take(n), nel.toList.take(n)),
    )(List.Eq(Eq.fromUniversalEquals())),
  );

  test(
    'takeWhile to be evq to toList.takeWhile',
    forAll(
      A.fp4tsNel(fc.integer()),
      fc.func<[number], boolean>(fc.boolean()),
      (xs, p) =>
        expect(xs.takeWhile(p).toArray).toEqual(xs.toList.takeWhile(p).toArray),
    ),
  );

  test(
    'takeRight to be evq toList.takeRight',
    forAll(
      A.fp4tsNel(fc.integer()),
      fc.integer(),
      (nel, n) => new IsEq(nel.takeRight(n), nel.toList.takeRight(n)),
    )(List.Eq(Eq.fromUniversalEquals())),
  );

  test(
    'drop to be evq toList.drop',
    forAll(
      A.fp4tsNel(fc.integer()),
      fc.integer(),
      (nel, n) => new IsEq(nel.drop(n), nel.toList.drop(n)),
    )(List.Eq(Eq.fromUniversalEquals())),
  );

  test(
    'dropWhile to be evq to toList.dropWhile',
    forAll(
      A.fp4tsNel(fc.integer()),
      fc.func<[number], boolean>(fc.boolean()),
      (xs, p) =>
        expect(xs.dropWhile(p).toArray).toEqual(xs.toList.dropWhile(p).toArray),
    ),
  );

  test(
    'dropRight to be evq toList.dropRight',
    forAll(
      A.fp4tsNel(fc.integer()),
      fc.integer(),
      (nel, n) => new IsEq(nel.dropRight(n), nel.toList.dropRight(n)),
    )(List.Eq(Eq.fromUniversalEquals())),
  );

  test(
    'slice to be evq toList.slice',
    forAll(
      A.fp4tsNel(fc.integer()),
      fc.integer(),
      fc.integer(),
      (nel, from, to) =>
        new IsEq(nel.slice(from, to), nel.toList.slice(from, to)),
    )(List.Eq(Eq.fromUniversalEquals())),
  );

  test(
    'filter to be evq toList.filter',
    forAll(
      A.fp4tsNel(fc.integer()),
      fc.func<[number], boolean>(fc.boolean()),
      (nel, f) => new IsEq(nel.filter(f), nel.toList.filter(f)),
    )(List.Eq(Eq.fromUniversalEquals())),
  );

  test(
    'collect to be evq toList.collect',
    forAll(
      A.fp4tsNel(fc.integer()),
      fc.func<[number], Option<string>>(A.fp4tsOption(fc.string())),
      (nel, f) => new IsEq(nel.collect(f), nel.toList.collect(f)),
    )(List.Eq(Eq.fromUniversalEquals())),
  );

  test(
    'collectWhile to be evq toList.collectWhile',
    forAll(
      A.fp4tsNel(fc.integer()),
      fc.func<[number], Option<string>>(A.fp4tsOption(fc.string())),
      (nel, f) => new IsEq(nel.collectWhile(f), nel.toList.collectWhile(f)),
    )(List.Eq(Eq.fromUniversalEquals())),
  );

  test(
    'map to be evq toList.map',
    forAll(
      A.fp4tsNel(fc.integer()),
      fc.func<[number], string>(fc.string()),
      (nel, f) => new IsEq(nel.map(f).toList, nel.toList.map(f)),
    )(List.Eq(Eq.fromUniversalEquals())),
  );

  test(
    'flatMap to be evq toList.flatMap',
    forAll(
      A.fp4tsNel(fc.integer()),
      fc.func<[number], Nel<string>>(A.fp4tsNel(fc.string())),
      (nel, f) =>
        new IsEq(
          nel.flatMap(f).toList,
          nel.toList.flatMap(x => f(x).toList),
        ),
    )(List.Eq(Eq.fromUniversalEquals())),
  );

  test(
    'zip to be evq toList.zip',
    forAll(
      A.fp4tsNel(fc.integer()),
      A.fp4tsNel(fc.string()),
      (xs, ys) => new IsEq(xs.zip(ys).toList, xs.toList.zip(ys.toList)),
    )(List.Eq(Eq.tuple2(Eq.fromUniversalEquals(), Eq.fromUniversalEquals()))),
  );

  test(
    'partition to be evq toList.partition',
    forAll(
      A.fp4tsNel(fc.integer()),
      fc.func<[number], Either<number, number>>(
        A.fp4tsEither(fc.integer(), fc.integer()),
      ),
      (xs, f) => new IsEq(xs.partition(f), xs.toList.partition(f)),
    )(
      Eq.tuple2(
        List.Eq(Eq.fromUniversalEquals()),
        List.Eq(Eq.fromUniversalEquals()),
      ),
    ),
  );

  test(
    'foldLeft to be evq toList.foldLeft',
    forAll(
      A.fp4tsNel(fc.integer()),
      fc.string(),
      fc.func<[string, number], string>(fc.string()),
      (xs, z, f) => xs.foldLeft(z, f) === xs.toList.foldLeft(z, f),
    ),
  );

  test(
    'foldLeft1 to be evq toList.foldLeft1',
    forAll(
      A.fp4tsNel(fc.integer()),
      fc.func<[number, number], number>(fc.integer()),
      (xs, f) => xs.foldLeft1(f) === xs.toList.foldLeft1(f),
    ),
  );

  test(
    'foldRight to be evq toList.foldRight',
    forAll(
      A.fp4tsNel(fc.integer()),
      A.fp4tsEval(fc.string()),
      fc.func<[number, Eval<string>], Eval<string>>(A.fp4tsEval(fc.string())),
      (xs, z, f) =>
        xs.foldRight(z, f).value === xs.toList.foldRight(z, f).value,
    ),
  );

  test(
    'foldRight1 to be evq toList.foldRight1',
    forAll(
      A.fp4tsNel(fc.integer()),
      fc.func<[number, Eval<number>], Eval<number>>(A.fp4tsEval(fc.integer())),
      (xs, f) => xs.foldRight1(f).value === xs.toList.foldRight1(f).value,
    ),
  );

  test(
    'foldRight_ to be evq toList.foldRight_',
    forAll(
      A.fp4tsNel(fc.integer()),
      fc.string(),
      fc.func<[number, string], string>(fc.string()),
      (xs, z, f) => xs.foldRight_(z, f) === xs.toList.foldRight_(z, f),
    ),
  );

  test(
    'foldRight1_ to be evq toList.foldRight1_',
    forAll(
      A.fp4tsNel(fc.integer()),
      fc.func<[number, number], number>(fc.integer()),
      (xs, f) => xs.foldRight1_(f) === xs.toList.foldRight1_(f),
    ),
  );

  test(
    'equals to be evq toList.equals',
    forAll(
      A.fp4tsNel(fc.integer()),
      A.fp4tsNel(fc.integer()),
      (xs, ys) =>
        xs.equals(Eq.fromUniversalEquals(), ys) ===
        xs.toList.equals(Eq.fromUniversalEquals(), ys.toList),
    ),
  );

  describe('Laws', () => {
    const semigroupKTests = SemigroupKSuite(Nel.SemigroupK);
    checkAll(
      'SemigroupK<Nel>',
      semigroupKTests.semigroupK(
        fc.integer(),
        Eq.fromUniversalEquals(),
        A.fp4tsNel,
        Nel.EqK.liftEq,
      ),
    );

    const alignTests = AlignSuite(Nel.Align);
    checkAll(
      'Align<Nel>',
      alignTests.align(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        A.fp4tsNel,
        Nel.EqK.liftEq,
      ),
    );

    const coflatMapTests = CoflatMapSuite(Nel.CoflatMap);
    checkAll(
      'coflatMap<Nel>',
      coflatMapTests.coflatMap(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        A.fp4tsNel,
        Nel.EqK.liftEq,
      ),
    );

    const monadTests = MonadSuite(Nel.Monad);
    checkAll(
      'monad<Nel>',
      monadTests.monad(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        A.fp4tsNel,
        Nel.EqK.liftEq,
      ),
    );

    const traversableTests = TraversableSuite(Nel.Traversable);
    checkAll(
      'traversable<Nel>',
      traversableTests.traversable(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        CommutativeMonoid.addition,
        CommutativeMonoid.addition,
        Nel.Functor,
        Eval.Applicative,
        Option.Applicative,
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        A.fp4tsNel,
        Nel.EqK.liftEq,
        A.fp4tsEval,
        Eval.Eq,
        A.fp4tsOption,
        Option.Eq,
      ),
    );
  });
});
