import '@fp4ts/effect-test-kit/lib/jest-extension';
import fc from 'fast-check';
import { id, throwError } from '@fp4ts/core';
import {
  Eq,
  Either,
  Left,
  List,
  Vector,
  Right,
  Some,
  None,
  Option,
} from '@fp4ts/cats';
import { IO, IoK, SyncIO, SyncIoK } from '@fp4ts/effect';
import { Stream } from '@fp4ts/stream-core';
import {
  AlignSuite,
  FunctorFilterSuite,
  MonadErrorSuite,
  MonoidKSuite,
} from '@fp4ts/cats-laws';
import { forAll, checkAll, IsEq } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/stream-test-kit/lib/arbitraries';
import * as E from '@fp4ts/effect-test-kit/lib/eq';

const StreamSync = <A>(...xs: A[]): Stream<SyncIoK, A> => Stream.fromArray(xs);

describe('Effect-ful stream', () => {
  describe('repeatEval', () => {
    it('should repeat pulling from counter', () => {
      let counter = 0;
      const count = SyncIO.delay(() => counter++);

      expect(
        Stream.repeatEval<SyncIoK, number>(count)
          .take(5)
          .compileSync()
          .toList.unsafeRunSync(),
      ).toEqual(List(0, 1, 2, 3, 4));
    });
  });

  describe('evalMap', () => {
    it('should transform the stream', () => {
      expect(
        StreamSync(1, 2, 3, 4, 5)
          .evalMap(x => SyncIO(() => x * 2))
          .compileSync()
          .toList.unsafeRunSync(),
      ).toEqual(List(2, 4, 6, 8, 10));
    });

    it('should rethrow the error when effect throws', () => {
      expect(
        StreamSync(1, 2, 3, 4)
          .evalMap(x =>
            x === 3
              ? SyncIO.throwError(new Error('test error'))
              : SyncIO.pure(x),
          )
          .attempt.compileSync()
          .toArray.unsafeRunSync(),
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
          .compileConcurrent().toList,
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
          .compileSync()
          .toList.unsafeRunSync(),
      ).toEqual(List(2, 4, 6));
    });

    it('should be stack safe', () => {
      expect(
        StreamSync(1)
          .repeat.chunkN(100)
          .unchunks.evalMapChunk(SyncIO.Applicative)(x => SyncIO(() => x * 2))
          .take(10_000)
          .compileSync()
          .toArray.unsafeRunSync(),
      ).toEqual([...new Array(10_000).keys()].map(() => 2));
    });
  });

  describe('evalCollect', () => {
    it('should consume only even numbers', () => {
      expect(
        Stream(1, 2, 3, 4, 5)
          .covary<SyncIoK>()
          .evalCollect(x => SyncIO(() => (x % 2 === 0 ? Some(x) : None)))
          .compileSync()
          .toArray.unsafeRunSync(),
      ).toEqual([2, 4]);
    });

    test(
      'evalCollect is evalMap and collect identity',
      forAll(
        A.fp4tsEffectStreamGenerator<SyncIoK, number>(
          fc.integer(),
          A.fp4tsSyncIO(fc.integer()),
        ),
        fc.func<[number], Option<string>>(A.fp4tsOption(fc.string())),
        (s, f) =>
          new IsEq(
            s.evalCollect(x => SyncIO(() => f(x))).attempt,
            s.evalMap(x => SyncIO(() => f(x))).collect(id).attempt,
          ),
      )(
        Eq.by(List.Eq(Either.Eq(Eq.Error.strict, Eq.primitive)), s =>
          s.compileSync().toList.unsafeRunSync(),
        ),
      ),
    );
  });

  describe('evalScan', () => {
    it('should create cumulative addition of the stream', () => {
      expect(
        Stream(1, 2, 3, 4)
          .covary<SyncIoK>()
          .evalScan(0, (acc, i) => SyncIO(() => acc + i))
          .compileSync()
          .toArray.unsafeRunSync(),
      ).toEqual([0, 1, 3, 6, 10]);
    });

    it('should extend the type', () => {
      expect(
        Stream(1, 2, 3, 4)
          .covary<SyncIoK>()
          .evalScan(0, (acc, i) => SyncIO(() => acc + i))
          .compileSync()
          .toArray.unsafeRunSync(),
      ).toEqual([0, 1, 3, 6, 10]);
    });
  });

  describe('attempt', () => {
    it('should wrap values to Right when successful', () => {
      expect(
        Stream(1, 2, 3)
          .map(x => x * x)
          .attempt.compile().toList,
      ).toEqual(List(Right(1), Right(4), Right(9)));
    });

    it('should wrap capture erroneous chunk', () => {
      expect(
        Stream.throwError<SyncIoK>(new Error('test error'))
          .attempt.compileSync()
          .last.unsafeRunSync(),
      ).toEqual(Left(new Error('test error')));
    });

    it('should isolate already executed chunks', () => {
      expect(
        Stream(1, 2, 3)
          ['+++'](Stream.throwError(new Error('test error')))
          .map(x => x * 2)
          .attempt.compile().toList,
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
        Stream(1, 2, 3)
          .redeemWith(
            () => Stream(-1),
            x => Stream(x * 2),
          )
          .compile().toList,
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
        )
        .compile().drain;

      expect(error!).toEqual(new Error('test error'));
    });

    it('should transform erroneous values', () => {
      expect(
        Stream(1, 2, 3)
          ['+++'](Stream.throwError(new Error('test error')))
          .redeemWith(
            () => Stream(-1),
            x => Stream(x * 2),
          )
          .compile().toList,
      ).toEqual(List(2, 4, 6, -1));
    });
  });

  describe('rethrow', () => {
    it('should strip away the Right values', () => {
      expect(
        Stream(Right(1), Right(2), Right(3)).rethrow.compile().toList,
      ).toEqual(List(1, 2, 3));
    });

    it('should throw an error when left value encountered', () => {
      expect(
        Stream<SyncIoK, Either<Error, number>>(
          Right(1),
          Right(2),
          Left(new Error('test, error')),
          Right(4),
        )
          .rethrow.handleErrorWith(() => Stream(-1))
          .compileSync()
          .toList.unsafeRunSync(),
      ).toEqual(List(-1));
    });
  });

  describe('handleErrorWith', () => {
    it('should capture suspended error', () => {
      const s = Stream.defer(() => throwError(new Error('test error')));
      expect(() => s.compile().drain).toThrow(new Error('test error'));
    });

    it('should propagate thrown error', () => {
      const s = Stream.throwError(new Error('test error')).as<void>(undefined);
      expect(() => s.compile().drain).toThrow(new Error('test error'));
    });

    it('should short circuit the execution', () => {
      const s = Stream.throwError(new Error('test error')).flatMap(() =>
        Stream(42),
      );

      expect(() => s.compile().drain).toThrow(new Error('test error'));
    });

    it('should return the result of the handler when an error is ocurred', () => {
      expect(
        Stream.evalF<SyncIoK>(SyncIO.throwError(new Error('test error')))
          .handleErrorWith(() => Stream(42))
          .compileSync()
          .last.unsafeRunSync(),
      ).toBe(42);
    });

    it.ticked(
      'should return the result of the handler when an error is ocurred',
      ticker => {
        expect(
          Stream.evalF<IoK>(IO.throwError(new Error('test error')))
            .handleErrorWith(() => Stream(42))
            .compileConcurrent().last,
        ).toCompleteWith(42, ticker);
      },
    );

    it('should capture error thrown upstream', () => {
      let error: Error;

      Stream.evalF<SyncIoK>(SyncIO.throwError(new Error('test error')))
        .handleErrorWith(e => {
          error = e;
          return Stream.empty();
        })
        .compileSync()
        .drain.unsafeRunSync();

      expect(error!).toEqual(new Error('test error'));
    });

    it('should capture exception from map function', () => {
      let error: Error;

      Stream(1, 2, 3, 4)
        .map(x => (x === 1 ? throwError(new Error('test error')) : x))
        .handleErrorWith(e => {
          error = e;
          return Stream();
        })
        .compile().drain;

      expect(error!).toEqual(new Error('test error'));
    });

    it('should throwaway the rest of the values from erroneous chunk', () => {
      expect(
        Stream(1, 2, 3, 4, 5)
          .map(x => (x === 1 ? throwError(new Error('test error')) : x))
          .handleErrorWith(() => Stream(-1))
          .compile().toList,
      ).toEqual(List(-1));
    });

    it('should isolate streamed values on non-executed ones', () => {
      expect(
        Stream(1, 2, 3)
          ['+++'](Stream(4, 5, 6))
          .flatMap(x =>
            x === 3 ? Stream(throwError(new Error())) : Stream(x * x),
          )
          .handleErrorWith(() => Stream(-1))
          .compile().toList,
      ).toEqual(List(1, 4, -1));
    });

    it.ticked('should return success value', ticker => {
      const s = Stream.retry(IO.Temporal)(IO.pure(42), 20, n => n * 2, 3);

      expect(s.compileConcurrent().last).toCompleteWith(42, ticker);
    });

    it.ticked('should succeed on second retry', ticker => {
      let i = 0;
      const s = Stream.retry(IO.Temporal)(
        IO(() => (i++ < 2 ? throwError(new Error('test error')) : 42)),
        20,
        n => n * 2,
        3,
      );

      expect(s.compileConcurrent().last).toCompleteWith(42, ticker);
    });

    it.ticked('should throw an error when retry limit exceeded', ticker => {
      const s = Stream.retry(IO.Temporal)(
        IO.throwError(new Error('test error')),
        20,
        n => n * 2,
        3,
      );

      expect(s.compileConcurrent().last).toFailWith(
        new Error('test error'),
        ticker,
      );
    });

    it.ticked('should retry the stream in 1-second intervals', ticker => {
      let i = 0;
      let results: Vector<Either<Error, any>> = Vector.empty;
      const s = Stream.evalF<IoK, void>(IO.sleep(1_000))
        .drain['+++'](
          Stream.retry(IO.Temporal)(
            IO(() => i++)['>>>'](IO.throwError(new Error('test error'))),
            1_000,
            id,
            3,
          ),
        )
        .attempt.evalMap(ea => IO(() => (results = results['::+'](ea))));

      const io = s.compileConcurrent().drain;
      io.unsafeRunToPromise({
        config: { autoSuspendThreshold: Infinity },
        executionContext: ticker.ctx,
        shutdown: () => {},
      });

      // after 1 second:
      //  first throwing action have been executed and threw
      ticker.ctx.tick();
      ticker.ctx.tick(1_000);
      expect(i).toBe(1);

      // after 2 seconds:
      //  second throwing action have been executed and threw
      ticker.ctx.tick(1_000);
      expect(i).toBe(2);

      // after 3 seconds:
      //  third throwing action have been executed and threw. Here we exhaust retry limit and yield the only erroneous value
      ticker.ctx.tick(1_000);
      expect(i).toBe(3);
      expect(results.toArray).toEqual([Left(new Error('test error'))]);
    });
  });

  it.ticked(
    'should evaluate effect when halt signal does not complete and cancels the the signal',
    ticker => {
      let evaluated: boolean = false;
      let canceledEffect: boolean = false;
      let canceledSignal: boolean = false;
      const s = Stream.evalF<IoK, void>(
        IO.sleep(2_000)
          ['>>>'](IO(() => (evaluated = true)).void)
          .onCancel(IO(() => (canceledEffect = true)).void),
      ).interruptWhen(
        IO.sleep(3_000).attempt.onCancel(
          IO(() => (canceledSignal = true)).void,
        ),
      );

      const io = s.compileConcurrent().drain;
      io.unsafeRunToPromise({
        config: { autoSuspendThreshold: Infinity },
        executionContext: ticker.ctx,
        shutdown: () => {},
      });

      // after 1 second:
      //  effect should not be evaluated and neither of the tasks should be canceled
      ticker.ctx.tick();
      ticker.ctx.tick(1_000);
      expect(evaluated).toBe(false);
      expect(canceledEffect).toBe(false);
      expect(canceledSignal).toBe(false);

      // after 2 seconds:
      //  effect should be evaluated and the signal should be canceled
      ticker.ctx.tick(1_000);
      expect(evaluated).toBe(true);
      expect(canceledEffect).toBe(false);
      expect(canceledSignal).toBe(true);

      // after 3 seconds:
      //  effect should be evaluated and the signal should be canceled
      ticker.ctx.tick(1_000);
      expect(evaluated).toBe(true);
      expect(canceledEffect).toBe(false);
      expect(canceledSignal).toBe(true);
    },
  );

  it.ticked('should interrupt a never executing evaluated event', ticker => {
    let canceled: boolean = false;
    const s = Stream.evalF<IoK>(
      IO.never.onCancel(IO(() => (canceled = true)).void),
    ).interruptWhen(IO.sleep(1_000).attempt);

    const io = s.compileConcurrent().drain;
    expect(io).toCompleteWith(undefined, ticker);
    expect(canceled).toBe(true);
  });

  it.ticked(
    'should not evaluate effect when halt signal completes before the effect does',
    ticker => {
      let evaluated: boolean = false;
      let canceledEffect: boolean = false;
      let canceledSignal: boolean = false;
      const s = Stream.evalF<IoK, void>(
        IO.sleep(3_000)
          ['>>>'](IO(() => (evaluated = true)).void)
          .onCancel(IO(() => (canceledEffect = true)).void),
      ).interruptWhen(
        IO.sleep(2_000).attempt.onCancel(
          IO(() => (canceledSignal = true)).void,
        ),
      );

      const io = s.compileConcurrent().drain;
      io.unsafeRunToPromise({
        config: { autoSuspendThreshold: Infinity },
        executionContext: ticker.ctx,
        shutdown: () => {},
      });

      // after 1 second:
      //  effect should not be evaluated and neither of the tasks should be canceled
      ticker.ctx.tick();
      ticker.ctx.tick(1_000);
      expect(evaluated).toBe(false);
      expect(canceledEffect).toBe(false);
      expect(canceledSignal).toBe(false);

      // after 2 seconds:
      //  signal should complete and the effect should be canceled
      ticker.ctx.tick(1_000);
      expect(evaluated).toBe(false);
      expect(canceledEffect).toBe(true);
      expect(canceledSignal).toBe(false);

      // after 3 seconds:
      //  effect should be evaluated and the signal should be canceled
      ticker.ctx.tick(1_000);
      expect(evaluated).toBe(false);
      expect(canceledEffect).toBe(true);
      expect(canceledSignal).toBe(false);
    },
  );

  describe.ticked('Laws', ticker => {
    const ioEqStream = <X>(EqX: Eq<X>): Eq<Stream<IoK, X>> =>
      Eq.by(E.eqIO(List.Eq(EqX), ticker), s => s.compileConcurrent().toList);

    const monoidKTests = MonoidKSuite(Stream.MonoidK<IoK>());
    checkAll(
      'MonoidK<$<StreamK, [IoK]>>',
      monoidKTests.monoidK(
        fc.integer(),
        Eq.primitive,
        arbX => A.fp4tsEffectStreamGenerator(arbX, A.fp4tsIO(arbX)),
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
        arbX => A.fp4tsEffectStreamGenerator(arbX, A.fp4tsIO(arbX)),
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
        arbX => A.fp4tsEffectStreamGenerator(arbX, A.fp4tsIO(arbX)),
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
        A.fp4tsError(),
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.primitive,
        Eq.Error.strict,
        arbX => A.fp4tsEffectStreamGenerator(arbX, A.fp4tsIO(arbX)),
        ioEqStream,
      ),
    );
  });
});
