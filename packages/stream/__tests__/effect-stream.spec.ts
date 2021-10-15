import '@cats4ts/effect-test-kit/lib/jest-extension';
import fc from 'fast-check';
import { throwError } from '@cats4ts/core';
import { Eq, Either, Left, List, Right } from '@cats4ts/cats';
import { IO, IoK, SyncIO, SyncIoK } from '@cats4ts/effect';
import { Stream } from '@cats4ts/stream-core';
import {
  AlignSuite,
  FunctorFilterSuite,
  MonadErrorSuite,
  MonoidKSuite,
} from '@cats4ts/cats-laws';
import { checkAll } from '@cats4ts/cats-test-kit';
import * as A from '@cats4ts/stream-test-kit/lib/arbitraries';
import * as E from '@cats4ts/effect-test-kit/lib/eq';

const StreamSync = <A>(...xs: A[]): Stream<SyncIoK, A> => Stream.fromArray(xs);

describe('Effect-ful stream', () => {
  describe('repeatEval', () => {
    it('should repeat pulling from counter', () => {
      let counter = 0;
      const count = SyncIO.delay(() => counter++);

      expect(Stream.repeatEval<SyncIoK, number>(count).take(5).toList).toEqual(
        List(0, 1, 2, 3, 4),
      );
    });
  });

  describe('evalMap', () => {
    it('should transform the stream', () => {
      expect(
        StreamSync(1, 2, 3, 4, 5).evalMap(x => SyncIO(() => x * 2)).compile
          .toList,
      ).toEqual(List(2, 4, 6, 8, 10));
    });

    it('should rethrow the error when effect throws', () => {
      expect(
        StreamSync(1, 2, 3, 4).evalMap(x =>
          x === 3 ? SyncIO.throwError(new Error('test error')) : SyncIO.pure(x),
        ).attempt.compile.toArray,
      ).toEqual([Right(1), Right(2), Left(new Error('test error'))]);
    });

    it.ticked('should take three attempts', ticker => {
      let i = 0;
      expect(
        Stream.evalF<IoK, number>(
          IO(() => {
            if (i++ % 2 === 0) throwError(new Error('test error'));
            return i;
          }),
        )
          .attempts(IO.Temporal)(Stream<IoK, number>(1).repeat)
          .take(3)
          .compileF(IO.MonadError).toList,
      ).toCompleteWith(
        List<Either<Error, number>>(
          Left(new Error('test error')),
          Right(2),
          Left(new Error('test error')),
        ),
        ticker,
      );
    });
  });

  describe('evalMapChunk', () => {
    it('should transform chunks using effect-ful transformation', () => {
      expect(
        StreamSync(1, 2, 3)
          .chunkLimit(1)
          .unchunks.evalMapChunk(SyncIO.Applicative)(x => SyncIO(() => x * 2))
          .compile.toList,
      ).toEqual(List(2, 4, 6));
    });

    it('should be stack safe', () => {
      expect(
        StreamSync(1)
          .repeat.chunkN(100)
          .unchunks.evalMapChunk(SyncIO.Applicative)(x => SyncIO(() => x * 2))
          .take(10_000).compile.toArray,
      ).toEqual([...new Array(10_000).keys()].map(() => 2));
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
        Stream.throwError<SyncIoK>(new Error('test error')).attempt.compile
          .last,
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

  describe('redeemWith', () => {
    it('should transform successful values', () => {
      expect(
        Stream(1, 2, 3).redeemWith(
          () => Stream(-1),
          x => Stream(x * 2),
        ).compile.toList,
      ).toEqual(List(2, 4, 6));
    });

    it('should capture errors', () => {
      let error: Error;

      Stream(1, 2, 3)
        ['+++'](Stream.throwError(new Error('test error')))
        .redeemWith(
          e => {
            error = e;
            return Stream.empty();
          },
          () => Stream.empty(),
        ).compile.drain;

      expect(error!).toEqual(new Error('test error'));
    });

    it('should transform erroneous values', () => {
      expect(
        Stream(1, 2, 3)
          ['+++'](Stream.throwError(new Error('test error')))
          .redeemWith(
            () => Stream(-1),
            x => Stream(x * 2),
          ).compile.toList,
      ).toEqual(List(2, 4, 6, -1));
    });
  });

  describe('rethrow', () => {
    it('should strip away the Right values', () => {
      expect(
        Stream(Right(1), Right(2), Right(3)).rethrow.compile.toList,
      ).toEqual(List(1, 2, 3));
    });

    it('should throw an error when left value encountered', () => {
      expect(
        Stream<SyncIoK, Either<Error, number>>(
          Right(1),
          Right(2),
          Left(new Error('test, error')),
          Right(4),
        ).rethrow.handleErrorWith(() => Stream(-1)).compile.toList,
      ).toEqual(List(-1));
    });
  });

  describe('handleErrorWith', () => {
    it('should capture suspended error', () => {
      const s = Stream.defer(() => throwError(new Error('test error')));
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
        Stream.evalF<SyncIoK>(
          SyncIO.throwError(new Error('test error')),
        ).handleErrorWith(() => Stream(42)).compile.last,
      ).toBe(42);
    });

    it('should capture error thrown upstream', () => {
      let error: Error;

      Stream.evalF<SyncIoK>(
        SyncIO.throwError(new Error('test error')),
      ).handleErrorWith(e => {
        error = e;
        return Stream.empty();
      }).compile.drain;

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

    it.ticked('should return success value', ticker => {
      const s = Stream.retry(IO.Temporal)(IO.pure(42), 20, n => n * 2, 3);

      expect(s.compileF(IO.MonadError).last).toCompleteWith(42, ticker);
    });

    it.ticked('should succeed on second retry', ticker => {
      let i = 0;
      const s = Stream.retry(IO.Temporal)(
        IO(() => (i++ < 2 ? throwError(new Error('test error')) : 42)),
        20,
        n => n * 2,
        3,
      );

      expect(s.compileF(IO.MonadError).last).toCompleteWith(42, ticker);
    });

    it.ticked('should throw an error when retry limit exceeded', ticker => {
      const s = Stream.retry(IO.Temporal)(
        IO.throwError(new Error('test error')),
        20,
        n => n * 2,
        3,
      );

      expect(s.compileF(IO.MonadError).last).toFailWith(
        new Error('test error'),
        ticker,
      );
    });
  });

  describe.ticked('Laws', ticker => {
    const ioEqStream = <X>(EqX: Eq<X>): Eq<Stream<IoK, X>> =>
      Eq.by(
        E.eqIO(List.Eq(EqX), ticker),
        s => s.compileF(IO.MonadError).toList,
      );

    const monoidKTests = MonoidKSuite(Stream.MonoidK<IoK>());
    checkAll(
      'MonoidK<$<StreamK, [IoK]>>',
      monoidKTests.monoidK(
        fc.integer(),
        Eq.primitive,
        arbX => A.cats4tsEffectStreamGenerator(arbX, A.cats4tsIO(arbX)),
        ioEqStream,
      ),
    );

    const alignTests = AlignSuite(Stream.Align<IoK>());
    checkAll(
      'Align<$<StreamK, [IoK]>>',
      alignTests.align(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        arbX => A.cats4tsEffectStreamGenerator(arbX, A.cats4tsIO(arbX)),
        ioEqStream,
      ),
    );

    const functorFilterTests = FunctorFilterSuite(Stream.FunctorFilter<IoK>());
    checkAll(
      'FunctorFilter<$<StreamK, [IoK]>',
      functorFilterTests.functorFilter(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        arbX => A.cats4tsEffectStreamGenerator(arbX, A.cats4tsIO(arbX)),
        ioEqStream,
      ),
    );

    const monadErrorTests = MonadErrorSuite(Stream.MonadError<IoK>());
    checkAll(
      'MonadError<$<StreamK, [IoK]>>',
      monadErrorTests.monadError(
        fc.integer(),
        fc.integer(),
        fc.integer(),
        fc.integer(),
        A.cats4tsError(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.Error.strict,
        arbX => A.cats4tsEffectStreamGenerator(arbX, A.cats4tsIO(arbX)),
        ioEqStream,
      ),
    );
  });
});
