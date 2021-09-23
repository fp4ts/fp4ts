import { AnyK, throwError } from '@cats4ts/core';
import {
  Either,
  Left,
  List,
  Right,
  Some,
  Vector,
} from '@cats4ts/cats-core/lib/data';
import { SyncIO, SyncIoK } from '@cats4ts/effect-core';

import { Stream } from '../stream';
import { Chunk } from '../chunk';
import { None } from '@cats4ts/cats-core/lib/data/option/algebra';

describe('Stream', () => {
  describe('type', () => {
    it('should be covariant', () => {
      const s: Stream<AnyK, number> = Stream.empty();
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

      expect(Stream.suspend(() => s1).toList).toEqual(List(1, 2, 3, 4, 5));
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
      expect(Stream.empty().last.compile.toList).toEqual(List.empty);
    });

    it('should return last element of a singleton stream', () => {
      expect(Stream(42).last.compile.toList).toEqual(List(42));
    });

    it('should return last element of a stream', () => {
      expect(Stream(1, 2, 3).last.compile.toList).toEqual(List(3));
    });
  });

  describe('lastOption', () => {
    it('should return None when stream is empty', () => {
      expect(Stream.empty().lastOption.compile.toList).toEqual(List(None));
    });

    it('should return last element of a singleton stream', () => {
      expect(Stream(42).lastOption.compile.toList).toEqual(List(Some(42)));
    });

    it('should return last element of a stream', () => {
      expect(Stream(1, 2, 3).lastOption.compile.toList).toEqual(List(Some(3)));
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

  describe('repeatEval', () => {
    it('should repeat pulling from counter', () => {
      let counter = 0;
      const count = SyncIO.delay(() => counter++);

      expect(Stream.repeatEval<SyncIoK, number>(count).take(5).toList).toEqual(
        List(0, 1, 2, 3, 4),
      );
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
        Stream.empty() as Stream<AnyK, number>,
      );
      expect(s.take(10_000).compile.toArray).toEqual(xs);
    });
  });

  describe('takeRight', () => {
    it('should return empty stream if empty', () => {
      expect(Stream.empty().takeRight(5).compile.toList).toEqual(List.empty);
    });

    it('should return empty stream if non-positive number', () => {
      expect(Stream(1, 2, 3).takeRight(-1).compile.toList).toEqual(List.empty);
    });

    it('should return last two values of the stream', () => {
      expect(Stream(1, 2, 3).takeRight(2).compile.toList).toEqual(List(2, 3));
    });

    it('should return the entire stream', () => {
      expect(Stream(1, 2, 3).takeRight(10_000).compile.toList).toEqual(
        List(1, 2, 3),
      );
    });

    it('should be stack safe', () => {
      expect(Stream.range(0, 10_000).takeRight(10_000).compile.toArray).toEqual(
        [...new Array(10_000).keys()],
      );
    });
  });

  describe('takeWhile', () => {
    it('should take no elements when predicate returns false', () => {
      expect(Stream(1, 2, 3).takeWhile(() => false).compile.toList).toEqual(
        List.empty,
      );
    });

    it('should take single elements when taking a failure', () => {
      expect(
        Stream(1, 2, 3).takeWhile(() => false, true).compile.toList,
      ).toEqual(List(1));
    });

    it('should take even numbers', () => {
      expect(
        Stream(2, 4, 8, 9).takeWhile(x => x % 2 === 0).compile.toList,
      ).toEqual(List(2, 4, 8));
    });

    it('should take even numbers and first odd number', () => {
      expect(
        Stream(2, 4, 8, 9).takeWhile(x => x % 2 === 0, true).compile.toList,
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
        Stream.empty() as Stream<AnyK, number>,
      );
      expect(s.drop(10_000).compile.toArray).toEqual([]);
    });
  });

  describe('dropRight', () => {
    it('should return empty stream if empty', () => {
      expect(Stream.empty().dropRight(5).compile.toList).toEqual(List.empty);
    });

    it('should identity stream', () => {
      expect(Stream(1, 2, 3).dropRight(-1).compile.toList).toEqual(
        List(1, 2, 3),
      );
    });

    it('should return last value of the stream', () => {
      expect(Stream(1, 2, 3).dropRight(1).compile.toList).toEqual(List(1, 2));
    });

    it('should drop the entire stream', () => {
      expect(Stream(1, 2, 3).dropRight(10_000).compile.toList).toEqual(
        List.empty,
      );
    });

    it('should be stack safe', () => {
      expect(Stream.range(0, 10_000).dropRight(10_000).compile.toArray).toEqual(
        [],
      );
    });
  });

  describe('dropWhile', () => {
    it('should drop no elements when predicate returns false', () => {
      expect(Stream(1, 2, 3).dropWhile(() => false).compile.toList).toEqual(
        List(1, 2, 3),
      );
    });

    it('should drop single elements when dropping a failure', () => {
      expect(
        Stream(1, 2, 3).dropWhile(() => false, true).compile.toList,
      ).toEqual(List(2, 3));
    });

    it('should drop even numbers', () => {
      expect(
        Stream(2, 4, 8, 9).dropWhile(x => x % 2 === 0).compile.toList,
      ).toEqual(List(9));
    });

    it('should drop even numbers and first odd number', () => {
      expect(
        Stream(2, 4, 8, 9).dropWhile(x => x % 2 === 0, true).compile.toList,
      ).toEqual(List.empty);
    });
  });

  describe('attempt', () => {
    it('should wrap values to Right when successful', () => {
      expect(Stream(1, 2, 3).map(x => x * x).attempt.compile.toList).toEqual(
        List(Right(1), Right(4), Right(9)),
      );
    });

    it('should wrap capture erroneous chunk', () => {
      expect(
        Stream.throwError(new Error('test error')).attempt.compile.last,
      ).toEqual(Left(new Error('test error')));
    });

    it('should isolate already executed chunks', () => {
      expect(
        Stream(1, 2, 3)
          ['+++'](Stream.throwError(new Error('test error')))
          .map(x => x * 2).attempt.compile.toList,
      ).toEqual(
        List<Either<Error, number>>(
          Right(2),
          Right(4),
          Right(6),
          Left(new Error('test error')),
        ),
      );
    });
  });

  describe('handleErrorWith', () => {
    it('should capture suspended error', () => {
      const s = Stream.suspend(() => throwError(new Error('test error')));
      expect(() => s.compile.drain).toThrow(new Error('test error'));
    });

    it('should propagate thrown error', () => {
      const s = Stream.throwError(new Error('test error')).as<void>(undefined);
      expect(() => s.compile.drain).toThrow(new Error('test error'));
    });

    it('should short circuit the execution', () => {
      const s = Stream.throwError(new Error('test error')).flatMap(() =>
        Stream(42),
      );

      expect(() => s.compile.drain).toThrow(new Error('test error'));
    });

    it('should return the result of the handler when an error is ocurred', () => {
      expect(
        Stream.evalF(
          SyncIO.throwError(new Error('test error')),
        ).handleErrorWith(() => Stream(42)).compile.last,
      ).toBe(42);
    });

    it('should capture error thrown upstream', () => {
      let error: Error;

      Stream.evalF(SyncIO.throwError(new Error('test error'))).handleErrorWith(
        e => {
          error = e;
          return Stream.empty();
        },
      ).compile.drain;

      expect(error!).toEqual(new Error('test error'));
    });

    it('should capture exception from map function', () => {
      let error: Error;

      Stream(1, 2, 3, 4)
        .map(x => (x === 1 ? throwError(new Error('test error')) : x))
        .handleErrorWith(e => {
          error = e;
          return Stream();
        }).compile.drain;

      expect(error!).toEqual(new Error('test error'));
    });

    it('should throwaway the rest of the values from erroneous chunk', () => {
      expect(
        Stream(1, 2, 3, 4, 5)
          .map(x => (x === 1 ? throwError(new Error('test error')) : x))
          .handleErrorWith(() => Stream(-1)).compile.toList,
      ).toEqual(List(-1));
    });

    it('should isolate streamed values on non-executed ones', () => {
      expect(
        Stream(1, 2, 3)
          ['+++'](Stream(4, 5, 6))
          .flatMap(x =>
            x === 3 ? Stream(throwError(new Error())) : Stream(x * x),
          )
          .handleErrorWith(() => Stream(-1)).compile.toList,
      ).toEqual(List(1, 4, -1));
    });
  });

  describe('chunking', () => {
    it('should promote chunks to values', () => {
      expect(
        Stream(1, 2, 3)['+++'](Stream(4, 5, 6)).chunks.compile.toList,
      ).toEqual(List(Chunk(1, 2, 3), Chunk(4, 5, 6)));
    });

    it('should collect all values into a single chunk', () => {
      expect(
        Stream(1)['+++'](Stream(2))['+++'](Stream(3)).chunkAll.compile.last
          .toArray,
      ).toEqual([1, 2, 3]);
    });
  });

  describe('filtering', () => {
    it('should filter out all elements of the stream', () => {
      expect(Stream(1, 2, 3, 4, 5).filter(() => false).compile.toList).toEqual(
        List.empty,
      );
    });

    it('should filter out even elements of the list', () => {
      expect(
        Stream(1, 2, 3, 4, 5).filter(x => x % 2 === 0).compile.toList,
      ).toEqual(List(2, 4));
    });

    it('should filter out odd elements of the list', () => {
      expect(
        Stream(1, 2, 3, 4, 5).filterNot(x => x % 2 === 0).compile.toList,
      ).toEqual(List(1, 3, 5));
    });

    it('should collect even values as strings', () => {
      expect(
        Stream(1, 2, 3, 4, 5).collect(x => (x % 2 === 0 ? Some(`${x}`) : None))
          .compile.toList,
      ).toEqual(List('2', '4'));
    });

    it('should collect first even value', () => {
      expect(
        Stream(1, 3, 5, 6).collectFirst(x =>
          x % 2 === 0 ? Some(`${x}`) : None,
        ).compile.toList,
      ).toEqual(List('6'));
    });

    it('should collect even elements until first odd one occurs', () => {
      expect(
        Stream(2, 4, 6, 8, 9).collectWhile(x =>
          x % 2 === 0 ? Some(`${x}`) : None,
        ).compile.toList,
      ).toEqual(List('2', '4', '6', '8'));
    });
  });

  describe('folds', () => {
    it('should return initial value when empty', () => {
      expect(Stream.empty().fold(0, (x, y) => x + y).compile.last).toBe(0);
    });

    it('should add up all numbers of the stream', () => {
      expect(Stream(1, 2, 3, 4, 5).fold(0, (x, y) => x + y).compile.last).toBe(
        15,
      );
    });

    it('should foldMap using a list monoid', () => {
      expect(
        Stream(1, 2, 3, 4, 5).foldMap(List.MonoidK.algebra<number>())(List)
          .compile.last,
      ).toEqual(List(1, 2, 3, 4, 5));
    });

    it('should foldMap using a list monoidK', () => {
      expect(
        Stream(1, 2, 3, 4, 5).foldMapK(List.MonoidK)(List).compile.last,
      ).toEqual(List(1, 2, 3, 4, 5));
    });
  });

  describe('unfolds', () => {
    // TODO
  });

  describe('examples', () => {
    it('should calculate fibonacci sequence', () => {
      const fibs: Stream<AnyK, number> = Stream(0, 1)['+++'](
        Stream.suspend(() => fibs.zip(fibs.tail).map(([x, y]) => x + y)),
      );

      expect(fibs.take(11).toList).toEqual(
        List(0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55),
      );
    });
  });
});
