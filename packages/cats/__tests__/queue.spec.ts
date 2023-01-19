// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { tupled } from '@fp4ts/core';
import { CommutativeMonoid, Eq } from '@fp4ts/cats-kernel';
import { Monad } from '@fp4ts/cats-core';
import { Either, Option, Vector, List, Queue } from '@fp4ts/cats-core/lib/data';
import { checkAll, forAll } from '@fp4ts/cats-test-kit';
import {
  AlternativeSuite,
  MonadSuite,
  AlignSuite,
  CoflatMapSuite,
  TraversableFilterSuite,
} from '@fp4ts/cats-laws';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

describe('Queue', () => {
  describe('type', () => {
    it('should be covariant', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const xs: Queue<number> = Queue.empty;
    });

    it('should disallow type expansion of unrelated types', () => {
      const xs: Queue<number> = Queue.empty;
      // @ts-expect-error
      xs.prepend('string');
    });
  });

  describe('constructors', () => {
    it('should create an empty Queue', () => {
      const xs = Queue();
      expect(xs.isEmpty).toBe(true);
      expect(xs.toArray).toEqual([]);
    });

    it('should an empty Queue', () => {
      const xs = Queue.empty;
      expect(xs.isEmpty).toBe(true);
      expect(xs.toArray).toEqual([]);
    });

    it('should an empty Queue', () => {
      const xs = Queue(1, 2, 3);
      expect(xs.isEmpty).toBe(false);
      expect(xs.toArray).toEqual([1, 2, 3]);
    });

    it('should create a Queue from array', () => {
      const xs = Queue.fromArray([1, 2, 3]);
      expect(xs.toArray).toEqual([1, 2, 3]);
    });

    it('should create a Queue from enumeration', () => {
      const xs = Queue.of(1, 2, 3);
      expect(xs.toArray).toEqual([1, 2, 3]);
    });

    it('should create a queue from Queue', () => {
      expect(Queue.fromList(List(1, 2, 3))).toEqual(Queue(1, 2, 3));
    });

    it('should create a Queue from vector', () => {
      expect(Queue.fromVector(Vector(1, 2, 3))).toEqual(Queue(1, 2, 3));
    });
  });

  test(
    'isEmpty',
    forAll(A.fp4tsQueue(fc.integer()), q => q.isEmpty === q.toList.isEmpty),
  );

  test(
    'nonEmpty',
    forAll(A.fp4tsQueue(fc.integer()), q => q.nonEmpty === !q.isEmpty),
  );

  test(
    'size',
    forAll(A.fp4tsQueue(fc.integer()), q => q.size === q.toList.size),
  );

  test(
    'headOption',
    forAll(A.fp4tsQueue(fc.integer()), q =>
      q.headOption.equals(q.toList.headOption),
    ),
  );

  test(
    'tail',
    forAll(A.fp4tsQueue(fc.integer()), q =>
      q.tail.toList.equals(q.toList.tail),
    ),
  );

  test(
    'dequeue to be List.uncons',
    forAll(A.fp4tsQueue(fc.integer()), q =>
      q.dequeue
        .map(([h, tl]) => tupled(h, tl.toList))
        .equals(
          q.toList.uncons,
          Eq.of({
            equals: (lhs, rhs) => lhs[0] === rhs[0] && lhs[1].equals(rhs[1]),
          }),
        ),
    ),
  );

  test(
    'init',
    forAll(A.fp4tsQueue(fc.integer()), q =>
      q.init.toList.equals(q.toList.init),
    ),
  );

  test(
    'reverse',
    forAll(A.fp4tsQueue(fc.integer()), q =>
      q.reverse.toList.equals(q.toList.reverse),
    ),
  );

  test(
    'prepend',
    forAll(A.fp4tsQueue(fc.integer()), fc.integer(), (q, x) =>
      q.prepend(x).toList.equals(q.toList.prepend(x)),
    ),
  );

  test(
    'enqueue',
    forAll(A.fp4tsQueue(fc.integer()), fc.integer(), (q, x) =>
      q.enqueue(x).toList.equals(q.toList.append(x)),
    ),
  );

  test(
    'concat',
    forAll(A.fp4tsQueue(fc.integer()), A.fp4tsQueue(fc.integer()), (lhs, rhs) =>
      lhs['+++'](rhs).toList.equals(lhs.toList['++'](rhs.toList)),
    ),
  );

  test(
    'elem',
    forAll(A.fp4tsQueue(fc.integer()), q => {
      const xs = q.toList;
      const size = xs.size;
      for (let i = 0; i < size; i++) {
        expect(q['!!'](i)).toBe(xs['!!'](i));
      }
      return true;
    }),
  );

  test(
    'elemOption',
    forAll(A.fp4tsQueue(fc.integer()), fc.integer(), (q, idx) =>
      q['!?'](idx).equals(q.toList['!?'](idx)),
    ),
  );

  test(
    'all',
    forAll(
      A.fp4tsQueue(fc.integer()),
      fc.func<[number], boolean>(fc.boolean()),
      (q, p) => q.all(p) === q.toList.all(p),
    ),
  );

  test(
    'any',
    forAll(
      A.fp4tsQueue(fc.integer()),
      fc.func<[number], boolean>(fc.boolean()),
      (q, p) => q.any(p) === q.toList.any(p),
    ),
  );

  test(
    'count',
    forAll(
      A.fp4tsQueue(fc.integer()),
      fc.func<[number], boolean>(fc.boolean()),
      (q, p) => q.count(p) === q.toList.count(p),
    ),
  );

  test(
    'take',
    forAll(A.fp4tsQueue(fc.integer()), fc.integer(), (q, n) =>
      q.take(n).toList.equals(q.toList.take(n)),
    ),
  );
  test(
    'takeRight',
    forAll(A.fp4tsQueue(fc.integer()), fc.integer(), (q, n) =>
      q.takeRight(n).toList.equals(q.toList.takeRight(n)),
    ),
  );

  test(
    'drop',
    forAll(A.fp4tsQueue(fc.integer()), fc.integer(), (q, n) =>
      q.drop(n).toList.equals(q.toList.drop(n)),
    ),
  );
  test(
    'dropRight',
    forAll(A.fp4tsQueue(fc.integer()), fc.integer(), (q, n) =>
      q.dropRight(n).toList.equals(q.toList.dropRight(n)),
    ),
  );

  test(
    'slice',
    forAll(
      A.fp4tsQueue(fc.integer()),
      fc.integer(),
      fc.integer(),
      (q, from, until) =>
        q.slice(from, until).toList.equals(q.toList.slice(from, until)),
    ),
  );

  test(
    'filter',
    forAll(
      A.fp4tsQueue(fc.integer()),
      fc.func<[number], boolean>(fc.boolean()),
      (q, p) => q.filter(p).toList.equals(q.toList.filter(p)),
    ),
  );

  test(
    'collect',
    forAll(
      A.fp4tsQueue(fc.integer()),
      fc.func<[number], Option<string>>(A.fp4tsOption(fc.string())),
      (q, p) => q.collect(p).toList.equals(q.toList.collect(p)),
    ),
  );

  test(
    'collectWhile',
    forAll(
      A.fp4tsQueue(fc.integer()),
      fc.func<[number], Option<string>>(A.fp4tsOption(fc.string())),
      (q, p) => q.collectWhile(p).toList.equals(q.toList.collectWhile(p)),
    ),
  );

  test(
    'map',
    forAll(
      A.fp4tsQueue(fc.integer()),
      fc.func<[number], string>(fc.string()),
      (q, f) => q.map(f).toList.equals(q.toList.map(f)),
    ),
  );

  test(
    'flatMap',
    forAll(
      A.fp4tsQueue(fc.integer()),
      fc.func<[number], Queue<string>>(A.fp4tsQueue(fc.string())),
      (q, f) => q.flatMap(f).toList.equals(q.toList.flatMap(x => f(x).toList)),
    ),
  );

  test(
    'foldLeft',
    forAll(
      A.fp4tsQueue(fc.integer()),
      fc.string(),
      fc.func<[string, number], string>(fc.string()),
      (q, z, f) => q.foldLeft(z, f) === q.toList.foldLeft(z, f),
    ),
  );

  test(
    'foldRight',
    forAll(
      A.fp4tsQueue(fc.integer()),
      fc.string(),
      fc.func<[number, string], string>(fc.string()),
      (q, z, f) => q.foldRight(z, f) === q.toList.foldRight_(z, f),
    ),
  );

  test(
    'zipWith',
    forAll(
      A.fp4tsQueue(fc.integer()),
      A.fp4tsQueue(fc.string()),
      fc.func<[number, string], number>(fc.integer()),
      (lhs, rhs, f) =>
        lhs.zipWith(rhs, f).toList.equals(lhs.toList.zipWith(rhs.toList, f)),
    ),
  );

  test(
    'partition',
    forAll(A.fp4tsQueue(fc.integer()), fc.func(fc.boolean()), (q, f) => {
      const [lhsQ, rhsQ] = q.partition(f);
      const [lhs, rhs] = q.toList.partition(f);
      return lhsQ.toList.equals(lhs) && rhsQ.toList.equals(rhs);
    }),
  );

  test(
    'partitionWith',
    forAll(
      A.fp4tsQueue(fc.integer()),
      fc.func<[number], Either<string, string>>(
        A.fp4tsEither(fc.string(), fc.string()),
      ),
      (q, f) => {
        const [lhsQ, rhsQ] = q.partitionWith(f);
        const [lhs, rhs] = q.toList.partitionWith(f);
        return lhsQ.toList.equals(lhs) && rhsQ.toList.equals(rhs);
      },
    ),
  );

  test(
    'scanLeft',
    forAll(
      A.fp4tsQueue(fc.integer()),
      fc.string(),
      fc.func<[string, number], string>(fc.string()),
      (q, z, f) => {
        const q2 = q.scanLeft(z, f);
        return q2.toList.equals(q.toList.scanLeft(z, f));
      },
    ),
  );

  test(
    'scanRight',
    forAll(
      A.fp4tsQueue(fc.integer()),
      fc.string(),
      fc.func<[number, string], string>(fc.string()),
      (q, z, f) => {
        const q2 = q.scanRight(z, f);
        return q2.toList.equals(q.toList.scanRight_(z, f));
      },
    ),
  );

  describe('Laws', () => {
    checkAll(
      'Align<Queue>',
      AlignSuite(Queue.Align).align(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        A.fp4tsQueue,
        <X>(X: Eq<X>): Eq<Queue<X>> => Eq.by(List.Eq(X), q => q.toList),
      ),
    );

    checkAll(
      'Alternative<Queue>',
      AlternativeSuite(Queue.Alternative).alternative(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        A.fp4tsQueue,
        <X>(X: Eq<X>): Eq<Queue<X>> => Eq.by(List.Eq(X), q => q.toList),
      ),
    );

    checkAll(
      'CoflatMap<Queue>',
      CoflatMapSuite(Queue.CoflatMap).coflatMap(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        A.fp4tsQueue,
        <X>(X: Eq<X>): Eq<Queue<X>> => Eq.by(List.Eq(X), q => q.toList),
      ),
    );

    checkAll(
      'Monad<Queue>',
      MonadSuite(Queue.Monad).monad(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        A.fp4tsQueue,
        <X>(X: Eq<X>): Eq<Queue<X>> => Eq.by(List.Eq(X), q => q.toList),
      ),
    );

    checkAll(
      'TraversableFilter<Queue>',
      TraversableFilterSuite(Queue.TraversableFilter).traversableFilter(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        CommutativeMonoid.addition,
        CommutativeMonoid.addition,
        Queue.FunctorFilter,
        Monad.Eval,
        Monad.Eval,
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        Eq.fromUniversalEquals(),
        A.fp4tsQueue,
        <X>(X: Eq<X>): Eq<Queue<X>> => Eq.by(List.Eq(X), q => q.toList),
        A.fp4tsEval,
        Eq.Eval,
        A.fp4tsEval,
        Eq.Eval,
      ),
    );
  });
});
