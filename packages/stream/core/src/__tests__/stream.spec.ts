import { AnyK } from '@cats4ts/core';
import { List, Vector } from '@cats4ts/cats-core/lib/data';
import { Stream } from '../stream';

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
