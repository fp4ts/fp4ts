import fc from 'fast-check';
import { List, Some, Vector, None, Eq } from '@fp4ts/cats';
import { Stream, Chunk, PureK } from '@fp4ts/stream-core';
import {
  AlignSuite,
  FunctorFilterSuite,
  MonadSuite,
  MonoidKSuite,
} from '@fp4ts/cats-laws';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/stream-test-kit/lib/arbitraries';

describe('Pure Stream', () => {
  describe('type', () => {
    it('should be covariant', () => {
      const s: Stream<any, number> = Stream.empty();
    });
  });

  describe('constructors', () => {
    it('should create a single element stream', () => {
      expect(Stream.pure(1).toList).toEqual(List(1));
    });

    it('should create stream from enumerated list of elements', () => {
      expect(Stream(1, 2, 3, 4, 5).toList).toEqual(List(1, 2, 3, 4, 5));
    });

    it('should create stream from an array', () => {
      expect(Stream.fromArray([1, 2, 3, 4, 5]).toList).toEqual(
        List(1, 2, 3, 4, 5),
      );
    });

    it('should create stream from a list', () => {
      expect(Stream.fromList(List(1, 2, 3, 4, 5)).toList).toEqual(
        List(1, 2, 3, 4, 5),
      );
    });

    it('should create stream from a vector', () => {
      expect(Stream.fromVector(Vector(1, 2, 3, 4, 5)).toList).toEqual(
        List(1, 2, 3, 4, 5),
      );
    });

    it('should create a stream from a suspended stream', () => {
      const s1 = Stream(1, 2, 3, 4, 5);

      expect(Stream.defer(() => s1).toList).toEqual(List(1, 2, 3, 4, 5));
    });
  });

  describe('stream processing', () => {
    it('should not evaluate values that were not taken', () => {
      const xs = [jest.fn(), jest.fn(), jest.fn()];

      Stream.fromArray(xs)
        .flatMap(Stream)
        .map(f => f())
        .take(2).toList;

      expect(xs[0]).toHaveBeenCalled();
      expect(xs[1]).toHaveBeenCalled();
      expect(xs[2]).not.toHaveBeenCalled();
    });

    it('should emit no values when drained', () => {
      expect(Stream(1, 2, 3).drain.compile().toList).toEqual(List.empty);
    });
  });

  describe('head', () => {
    it('should return nothing if stream is empty', () => {
      expect(Stream.empty().head.toList).toEqual(List.empty);
    });

    it('should return first element of a singleton stream', () => {
      expect(Stream(1).head.toList).toEqual(List(1));
    });

    it('should return first element of a stream', () => {
      expect(Stream(1, 2, 3, 4).head.toList).toEqual(List(1));
    });
  });

  describe('headOption', () => {
    it('should return None if stream is empty', () => {
      expect(Stream.empty().headOption.toList).toEqual(List(None));
    });

    it('should return first element of a singleton stream', () => {
      expect(Stream(1).headOption.toList).toEqual(List(Some(1)));
    });

    it('should return first element of a stream', () => {
      expect(Stream(1, 2, 3, 4).headOption.toList).toEqual(List(Some(1)));
    });
  });

  describe('tail', () => {
    it('should return nothing if stream is empty', () => {
      expect(Stream.empty().tail.toList).toEqual(List.empty);
    });

    it('should return first element of a singleton stream', () => {
      expect(Stream(1).tail.toList).toEqual(List.empty);
    });

    it('should return first element of a stream', () => {
      expect(Stream(1, 2, 3, 4).tail.toList).toEqual(List(2, 3, 4));
    });
  });

  describe('last', () => {
    it('should return nothing when stream is empty', () => {
      expect(Stream.empty().last.compile().toList).toEqual(List.empty);
    });

    it('should return last element of a singleton stream', () => {
      expect(Stream(42).last.compile().toList).toEqual(List(42));
    });

    it('should return last element of a stream', () => {
      expect(Stream(1, 2, 3).last.compile().toList).toEqual(List(3));
    });
  });

  describe('lastOption', () => {
    it('should return None when stream is empty', () => {
      expect(Stream.empty().lastOption.compile().toList).toEqual(List(None));
    });

    it('should return last element of a singleton stream', () => {
      expect(Stream(42).lastOption.compile().toList).toEqual(List(Some(42)));
    });

    it('should return last element of a stream', () => {
      expect(Stream(1, 2, 3).lastOption.compile().toList).toEqual(
        List(Some(3)),
      );
    });
  });

  describe('init', () => {
    it('should return nothing if stream is empty', () => {
      expect(Stream.empty().init.toList).toEqual(List.empty);
    });

    it('should return first element of a singleton stream', () => {
      expect(Stream(1).init.toList).toEqual(List.empty);
    });

    it('should return last element of a stream', () => {
      expect(Stream(1, 2, 3, 4).init.toList).toEqual(List(1, 2, 3));
    });
  });

  describe('repeat', () => {
    it('should repeat singleton list', () => {
      expect(Stream(1).repeat.take(5).toList).toEqual(List(1, 1, 1, 1, 1));
    });

    it('should repeat nested stream', () => {
      expect(
        Stream(1)
          .flatMap(x => Stream(x, x + 1))
          .repeat.take(4).toList,
      ).toEqual(List(1, 2, 1, 2));
    });
  });

  describe('take', () => {
    it('should take no elements when stream is empty', () => {
      expect(Stream.empty().take(3).toList).toEqual(List.empty);
    });

    it('should take first element of the stream', () => {
      expect(Stream(1, 2, 3).take(1).toList).toEqual(List(1));
    });

    it('should take all elements from the stream', () => {
      expect(Stream(1, 2, 3).take(3).toList).toEqual(List(1, 2, 3));
    });

    it('should take all elements from the stream when number is greater', () => {
      expect(Stream(1, 2, 3).take(100).toList).toEqual(List(1, 2, 3));
    });

    it('should no elements when negative number passed in', () => {
      expect(Stream(1, 2, 3).take(-1).toList).toEqual(List.empty);
    });

    it('should be stack safe', () => {
      const xs = [...new Array(10_000).keys()];
      const s = xs.reduce(
        (ss, i) => ss['+++'](Stream(i)),
        Stream.empty() as Stream<PureK, number>,
      );
      expect(s.take(10_000).compile().toArray).toEqual(xs);
    });
  });

  describe('takeRight', () => {
    it('should output no values if empty', () => {
      expect(Stream.empty().takeRight(5).compile().toList).toEqual(List.empty);
    });

    it('should output no values if non-positive number', () => {
      expect(Stream(1, 2, 3).takeRight(-1).compile().toList).toEqual(
        List.empty,
      );
    });

    it('should return last two values of the stream', () => {
      expect(Stream(1, 2, 3).takeRight(2).compile().toList).toEqual(List(2, 3));
    });

    it('should return the entire stream', () => {
      expect(Stream(1, 2, 3).takeRight(10_000).compile().toList).toEqual(
        List(1, 2, 3),
      );
    });

    it('should be stack safe', () => {
      expect(
        Stream.range(0, 10_000).takeRight(10_000).compile().toArray,
      ).toEqual([...new Array(10_000).keys()]);
    });
  });

  describe('takeWhile', () => {
    it('should take no elements when predicate returns false', () => {
      expect(
        Stream(1, 2, 3)
          .takeWhile(() => false)
          .compile().toList,
      ).toEqual(List.empty);
    });

    it('should take single elements when taking a failure', () => {
      expect(
        Stream(1, 2, 3)
          .takeWhile(() => false, true)
          .compile().toList,
      ).toEqual(List(1));
    });

    it('should take even numbers', () => {
      expect(
        Stream(2, 4, 8, 9)
          .takeWhile(x => x % 2 === 0)
          .compile().toList,
      ).toEqual(List(2, 4, 8));
    });

    it('should take even numbers and first odd number', () => {
      expect(
        Stream(2, 4, 8, 9)
          .takeWhile(x => x % 2 === 0, true)
          .compile().toList,
      ).toEqual(List(2, 4, 8, 9));
    });
  });

  describe('drop', () => {
    it('should drop no elements when stream is empty', () => {
      expect(Stream.empty().drop(3).toList).toEqual(List.empty);
    });

    it('should drop first element of the stream', () => {
      expect(Stream(1, 2, 3).drop(1).toList).toEqual(List(2, 3));
    });

    it('should drop all elements from the stream', () => {
      expect(Stream(1, 2, 3).drop(3).toList).toEqual(List.empty);
    });

    it('should drop all elements from the stream when number is greater', () => {
      expect(Stream(1, 2, 3).drop(100).toList).toEqual(List.empty);
    });

    it('should no elements when negative number passed in', () => {
      expect(Stream(1, 2, 3).drop(-1).toList).toEqual(List(1, 2, 3));
    });

    it('should be stack safe', () => {
      const xs = [...new Array(10_000).keys()];
      const s = xs.reduce(
        (ss, i) => ss['+++'](Stream(i)),
        Stream.empty() as Stream<PureK, number>,
      );
      expect(s.drop(10_000).compile().toArray).toEqual([]);
    });
  });

  describe('dropRight', () => {
    it('should output no values if empty', () => {
      expect(Stream.empty().dropRight(5).compile().toList).toEqual(List.empty);
    });

    it('should identity stream', () => {
      expect(Stream(1, 2, 3).dropRight(-1).compile().toList).toEqual(
        List(1, 2, 3),
      );
    });

    it('should return last value of the stream', () => {
      expect(Stream(1, 2, 3).dropRight(1).compile().toList).toEqual(List(1, 2));
    });

    it('should drop the entire stream', () => {
      expect(Stream(1, 2, 3).dropRight(10_000).compile().toList).toEqual(
        List.empty,
      );
    });

    it('should be stack safe', () => {
      expect(
        Stream.range(0, 10_000).dropRight(10_000).compile().toArray,
      ).toEqual([]);
    });
  });

  describe('dropWhile', () => {
    it('should drop no elements when predicate returns false', () => {
      expect(
        Stream(1, 2, 3)
          .dropWhile(() => false)
          .compile().toList,
      ).toEqual(List(1, 2, 3));
    });

    it('should drop single elements when dropping a failure', () => {
      expect(
        Stream(1, 2, 3)
          .dropWhile(() => false, true)
          .compile().toList,
      ).toEqual(List(2, 3));
    });

    it('should drop even numbers', () => {
      expect(
        Stream(2, 4, 8, 9)
          .dropWhile(x => x % 2 === 0)
          .compile().toList,
      ).toEqual(List(9));
    });

    it('should drop even numbers and first odd number', () => {
      expect(
        Stream(2, 4, 8, 9)
          .dropWhile(x => x % 2 === 0, true)
          .compile().toList,
      ).toEqual(List.empty);
    });
  });

  describe('chunking', () => {
    it('should promote chunks to values', () => {
      expect(
        Stream(1, 2, 3)['+++'](Stream(4, 5, 6)).chunks.compile().toList,
      ).toEqual(List(Chunk(1, 2, 3), Chunk(4, 5, 6)));
    });

    it('should collect all values into a single chunk', () => {
      expect(
        Stream(1)['+++'](Stream(2))['+++'](Stream(3)).chunkAll.compile().last
          .toArray,
      ).toEqual([1, 2, 3]);
    });

    it('should do not do any modifications to chunks that are smaller than the limit', () => {
      expect(
        Stream(1, 2)
          ['+++'](Stream(4, 5)['+++'](Stream(5, 6)))
          .chunkLimit(100)
          .compile()
          .toList.map(c => c.toArray),
      ).toEqual(List([1, 2], [4, 5], [5, 6]));
    });

    it('should split larger chunks to be at most two elements', () => {
      expect(
        Stream(1, 2, 3)
          ['+++'](Stream(4, 5)['+++'](Stream(6, 7, 8, 9)))
          .chunkLimit(2)
          .compile()
          .toList.map(x => x.toArray),
      ).toEqual(List([1, 2], [3], [4, 5], [6, 7], [8, 9]));
    });

    it('should  a single chunk', () => {
      expect(Stream(1, 2, 3).chunkMin(0).compile().toList).toEqual(
        List(Chunk(1, 2, 3)),
      );
    });

    it('should emit three chunks with a reminder', () => {
      expect(
        Stream(1, 2, 3, 4, 5)
          .chunkLimit(1)
          .unchunks.chunkMin(2, true)
          .compile()
          .toList.map(c => c.toArray),
      ).toEqual(List([1, 2], [3, 4], [5]));
    });

    it('should emit two chunks without a reminder', () => {
      expect(
        Stream(1, 2, 3, 4, 5)
          .chunkLimit(1)
          .unchunks.chunkMin(2, false)
          .compile()
          .toList.map(c => c.toArray),
      ).toEqual(List([1, 2], [3, 4]));
    });

    it('should drop elements that do not fit multiple of N', () => {
      expect(
        Stream(1, 2, 3, 4, 5, 6, 7)
          .chunkN(2, false)
          .compile()
          .toList.map(c => c.toArray),
      ).toEqual(List([1, 2], [3, 4], [5, 6]));
    });

    it('should include reminder as last smaller chunk', () => {
      expect(
        Stream(1, 2, 3, 4, 5, 6, 7)
          .chunkN(2, true)
          .compile()
          .toList.map(c => c.toArray),
      ).toEqual(List([1, 2], [3, 4], [5, 6], [7]));
    });

    it('should re-emit all chunks as values', () => {
      expect(Stream(1, 2, 3, 4, 5).chunkN(2).unchunks.toList).toEqual(
        List(1, 2, 3, 4),
      );
    });

    it('should create a sliding window with step > size', () => {
      expect(
        Stream(1, 2, 3, 4, 5)
          .sliding(2, 3)
          .compile()
          .toList.map(c => c.toArray),
      ).toEqual(List([1, 2], [4, 5]));
    });

    it('should create a sliding window with step < size', () => {
      expect(
        Stream(1, 2, 3, 4, 5)
          .sliding(3, 2)
          .compile()
          .toList.map(c => c.toArray),
      ).toEqual(List([1, 2, 3], [3, 4, 5]));
    });

    it('should be stack safe', () => {
      const xs = [...new Array(10_000).keys()];
      const ys = Stream.fromArray(xs).sliding(1).unchunks.compile().toArray;
      expect(ys).toEqual(xs);
    });
  });

  describe('filtering', () => {
    it('should filter out duplicated values', () => {
      expect(
        Stream(1, 1, 2, 2, 2, 2, 3, 4, 4, 5).changes().compile().toList,
      ).toEqual(List(1, 2, 3, 4, 5));
    });

    it('should filter out all elements of the stream', () => {
      expect(
        Stream(1, 2, 3, 4, 5)
          .filter(() => false)
          .compile().toList,
      ).toEqual(List.empty);
    });

    it('should filter out even elements of the list', () => {
      expect(
        Stream(1, 2, 3, 4, 5)
          .filter(x => x % 2 === 0)
          .compile().toList,
      ).toEqual(List(2, 4));
    });

    it('should filter out odd elements of the list', () => {
      expect(
        Stream(1, 2, 3, 4, 5)
          .filterNot(x => x % 2 === 0)
          .compile().toList,
      ).toEqual(List(1, 3, 5));
    });

    it('should collect even values as strings', () => {
      expect(
        Stream(1, 2, 3, 4, 5)
          .collect(x => (x % 2 === 0 ? Some(`${x}`) : None))
          .compile().toList,
      ).toEqual(List('2', '4'));
    });

    it('should collect first even value', () => {
      expect(
        Stream(1, 3, 5, 6)
          .collectFirst(x => (x % 2 === 0 ? Some(`${x}`) : None))
          .compile().toList,
      ).toEqual(List('6'));
    });

    it('should collect even elements until first odd one occurs', () => {
      expect(
        Stream(2, 4, 6, 8, 9)
          .collectWhile(x => (x % 2 === 0 ? Some(`${x}`) : None))
          .compile().toList,
      ).toEqual(List('2', '4', '6', '8'));
    });
  });

  describe('folds', () => {
    it('should return initial value when empty', () => {
      expect(
        Stream.empty()
          .fold(0, (x, y) => x + y)
          .compile().last,
      ).toBe(0);
    });

    it('should add up all numbers of the stream', () => {
      expect(
        Stream(1, 2, 3, 4, 5)
          .fold(0, (x, y) => x + y)
          .compile().last,
      ).toBe(15);
    });

    it('should foldMap using a list monoid', () => {
      expect(
        Stream(1, 2, 3, 4, 5)
          .foldMap(List.MonoidK.algebra<number>())(List)
          .compile().last,
      ).toEqual(List(1, 2, 3, 4, 5));
    });

    it('should foldMap using a list monoidK', () => {
      expect(
        Stream(1, 2, 3, 4, 5).foldMapK(List.MonoidK)(List).compile().last,
      ).toEqual(List(1, 2, 3, 4, 5));
    });
  });

  describe('unfolds', () => {
    it('should produce an empty stream', () => {
      expect(Stream.unfold(0)(() => None).compile().toList).toEqual(List.empty);
    });

    it('should produce sequence of numbers from 0 to 5', () => {
      expect(
        Stream.unfold(0)(n => (n <= 5 ? Some([n, n + 1]) : None)).compile()
          .toList,
      ).toEqual(List(0, 1, 2, 3, 4, 5));
    });

    it('should produce an empty stream from no chunks', () => {
      expect(Stream.unfoldChunk(0)(() => None).compile().toList).toEqual(
        List.empty,
      );
    });

    it('should produce stream of duplicated numbers from 0 to 5', () => {
      expect(
        Stream.unfoldChunk(0)(n =>
          n <= 5 ? Some([Chunk(n, n), n + 1]) : None,
        ).compile().toList,
      ).toEqual(List(0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5));
    });
  });

  describe('scan', () => {
    it('should produce a initial value singleton list when stream is empty', () => {
      expect(
        Stream.empty()
          .scan(0, () => -1)
          .compile().toList,
      ).toEqual(List(0));
    });

    it('should produce a rolling sum of streamed values', () => {
      expect(
        Stream(1, 2, 3, 4, 5)
          .scan(0, (x, y) => x + y)
          .compile().toList,
      ).toEqual(List(0, 1, 3, 6, 10, 15));
    });
  });

  describe('scan1', () => {
    it('should output no values if empty', () => {
      expect(
        Stream.empty()
          .scan1(() => -1)
          .compile().toList,
      ).toEqual(List.empty);
    });

    it('should produce a rolling sum of streamed values', () => {
      expect(
        Stream(1, 2, 3, 4, 5)
          .scan1((x, y) => x + y)
          .compile().toList,
      ).toEqual(List(1, 3, 6, 10, 15));
    });
  });

  describe('scanChunks', () => {
    it('should output no values if empty', () => {
      expect(
        Stream.empty()
          .scanChunks(0, (s, c) => [s, c])
          .compile().toList,
      ).toEqual(List.empty);
    });

    it('should produce cumulative sums', () => {
      expect(
        Stream(1, 2, 3, 4)
          .chunkN(2)
          .unchunks.scanChunks(0, (s, c) => {
            const [c2, s2] = c.scanLeftCarry(s, (x, y) => x + y);
            return [s2, c2];
          })
          .compile().toList,
      ).toEqual(List(1, 3, 6, 10));
    });
  });

  describe('zipping', () => {
    it('should emit no values when lhs is empty', () => {
      expect(Stream.empty().zip(Stream(1, 2, 3)).compile().toList).toEqual(
        List.empty,
      );
    });

    it('should emit no values when rhs is empty', () => {
      expect(Stream(1, 2, 3).zip(Stream.empty()).compile().toList).toEqual(
        List.empty,
      );
    });

    it('should zip two streams', () => {
      expect(Stream(1, 2, 3).zip(Stream(4, 5, 6)).compile().toList).toEqual(
        List([1, 4], [2, 5], [3, 6]),
      );
    });

    it('should pad lhs', () => {
      expect(
        Stream(1, 2).zipAll(Stream(4, 5, 6))(-1, -2).compile().toList,
      ).toEqual(List([1, 4], [2, 5], [-1, 6]));
    });

    it('should pad rhs', () => {
      expect(
        Stream(1, 2, 3).zipAll(Stream(4, 5))(-1, -2).compile().toList,
      ).toEqual(List([1, 4], [2, 5], [3, -2]));
    });

    it('should zip values with their indexes', () => {
      expect(Stream(1, 2, 3, 4, 5).zipWithIndex.compile().toList).toEqual(
        List([1, 0], [2, 1], [3, 2], [4, 3], [5, 4]),
      );
    });

    it('should zip each of the values with its successor', () => {
      expect(Stream(1, 2, 3).zipWithNext.compile().toList).toEqual(
        List([1, Some(2)], [2, Some(3)], [3, None]),
      );
    });

    it('should zip each of the values with its predecessor', () => {
      expect(Stream(1, 2, 3).zipWithPrevious.compile().toList).toEqual(
        List([None, 1], [Some(1), 2], [Some(2), 3]),
      );
    });
  });

  describe('examples', () => {
    it('should calculate fibonacci sequence', () => {
      const fibs: Stream<PureK, number> = Stream(0, 1)['+++'](
        Stream.defer(() => fibs.zip(fibs.tail).map(([x, y]) => x + y)),
      );

      expect(fibs.take(11).toList).toEqual(
        List(0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55),
      );
    });
  });

  const pureEqStream = <X>(EqX: Eq<X>): Eq<Stream<PureK, X>> =>
    Eq.by(List.Eq(EqX), s => s.compile().toList);

  const monoidKTests = MonoidKSuite(Stream.MonoidK<PureK>());
  checkAll(
    'MonoidK<$<StreamK, [PureK]>>',
    monoidKTests.monoidK(
      fc.integer(),
      Eq.primitive,
      A.fp4tsPureStreamGenerator,
      pureEqStream,
    ),
  );

  const alignTests = AlignSuite(Stream.Align<PureK>());
  checkAll(
    'Align<$<StreamK, [PureK]>>',
    alignTests.align(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      A.fp4tsPureStreamGenerator,
      pureEqStream,
    ),
  );

  const functorFilterTests = FunctorFilterSuite(Stream.FunctorFilter<PureK>());
  checkAll(
    'FunctorFilter<$<StreamK, [PureK]>',
    functorFilterTests.functorFilter(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      A.fp4tsPureStreamGenerator,
      pureEqStream,
    ),
  );

  const monadTests = MonadSuite(Stream.Monad<PureK>());
  checkAll(
    'Monad<$<StreamK, [PureK]>>',
    monadTests.monad(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      A.fp4tsPureStreamGenerator,
      pureEqStream,
    ),
  );
});
