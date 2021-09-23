import { AnyK, throwError } from '@cats4ts/core';
import { Either, Left, List, Right, Vector } from '@cats4ts/cats-core/lib/data';
import { SyncIO, SyncIoK } from '@cats4ts/effect-core';

import { Stream } from '../stream';
import { Chunk } from '../chunk';

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

  describe('benchmarks', () => {
    it('should do sth', () => {
      const xs = [...new Array(20_000).keys()];
      Stream.fromArray(xs).flatMap(Stream).zip(Stream(1).repeat).compile.toList;
    });
  });
});
