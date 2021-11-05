import fc from 'fast-check';
import { id } from '@fp4ts/core';
import { Eq, List, Either, Some, None } from '@fp4ts/cats';
import { IO, IoK } from '@fp4ts/effect';
import { Stream } from '@fp4ts/stream-core';
import * as A from '@fp4ts/stream-test-kit/lib/arbitraries';
import { TestError } from './test-error';

describe('Stream interruption', () => {
  const eraseTestError = (err: Error): IO<void> =>
    err instanceof TestError ? IO.unit : IO.throwError(err);

  it('should interrupt hung eval', () =>
    fc.assert(
      fc.asyncProperty(A.fp4tsPureStreamGenerator(fc.integer()), s => {
        const interruptSoon = Stream.sleep(IO.Temporal)(20).compileConcurrent()
          .drain.attempt;

        return Stream.defer(() =>
          s
            .covary<IoK>()
            .evalMap(() => IO.never)
            .interruptWhen(interruptSoon),
        )
          .compileConcurrent()
          .toList.flatMap(xs => IO(() => xs.isEmpty))
          .unsafeRunToPromise();
      }),
    ));

  it('should interrupt when interruption is hung', () =>
    fc.assert(
      fc.asyncProperty(A.fp4tsPureStreamGenerator(fc.integer()), s => {
        const interrupt = Stream.pure(true)['+++'](
          Stream.execF<IoK, never>(IO.never),
        );

        return Stream.defer(() =>
          s
            .covary<IoK>()
            .evalMap(() => IO.never)
            .interruptWhenTrue(IO.Concurrent)(interrupt),
        )
          .compileConcurrent()
          .toList.flatMap(xs => IO(() => xs.isEmpty))
          .unsafeRunToPromise();
      }),
    ));

  it('should interrupt a constant stream', () => {
    const interruptSoon = Stream.sleep(IO.Temporal)(20).compileConcurrent()
      .drain.attempt;

    return Stream.repeat(true)
      .covary<IoK>()
      .interruptWhen(interruptSoon)
      .compileConcurrent()
      .drain.unsafeRunToPromise();
  });

  it('should interrupt a constant stream with a flatMap', () => {
    const interruptSoon = Stream.sleep(IO.Temporal)(20).compileConcurrent()
      .drain.attempt;

    return Stream.repeat(true)
      .covary<IoK>()
      .interruptWhen(interruptSoon)
      .flatMap(() => Stream(1))
      .compileConcurrent()
      .drain.unsafeRunToPromise();
  });

  it('should interrupt infinitely recursive stream', () => {
    const interruptSoon = Stream.sleep(IO.Temporal)(20).compileConcurrent()
      .drain.attempt;

    const loop = (i: number): Stream<IoK, number> =>
      Stream(i)
        .covary<IoK>()
        .flatMap(() => Stream(i)['+++'](loop(i + 1)));

    return loop(0)
      .interruptWhen(interruptSoon)
      .compileConcurrent()
      .drain.unsafeRunToPromise();
  });

  it('should interrupt a infinitely recursive stream that never emits', () => {
    const interruptSoon = Stream.sleep(IO.Temporal)(20).compileConcurrent()
      .drain.attempt;

    const loop = (): Stream<IoK, never> =>
      Stream.evalF<IoK, void>(IO.unit).flatMap(() => Stream.defer(loop));

    return loop()
      .interruptWhen(interruptSoon)
      .compileConcurrent()
      .drain.unsafeRunToPromise();
  });

  it('should interrupt a infinitely recursive stream that never emits and has no eval', () => {
    const interruptSoon = Stream.sleep(IO.Temporal)(20).compileConcurrent()
      .drain.attempt;

    const loop = (): Stream<IoK, never> =>
      Stream().flatMap(() => Stream.defer(loop));

    return loop()
      .interruptWhen(interruptSoon)
      .compileConcurrent()
      .drain.unsafeRunToPromise();
  });

  it('should interrupt stream that repeatedly evaluates', () => {
    const interruptSoon = Stream.sleep(IO.Temporal)(20).compileConcurrent()
      .drain.attempt;

    return Stream.repeatEval<IoK, void>(IO.unit)
      .interruptWhen(interruptSoon)
      .flatMap(() => Stream(1))
      .compileConcurrent()
      .drain.unsafeRunToPromise();
  });

  it('should interrupt a constant drained stream', () => {
    const interruptSoon = Stream.sleep(IO.Temporal)(20).compileConcurrent()
      .drain.attempt;

    return Stream.repeat(true)
      .dropWhile(x => !x)
      .covary<IoK>()
      .interruptWhen(interruptSoon)
      .compileConcurrent()
      .drain.unsafeRunToPromise();
  });

  it('should terminate when the interruption stream is infinitely false', () =>
    fc.assert(
      fc.asyncProperty(A.fp4tsPureStreamGenerator(fc.integer()), s =>
        s
          .covary<IoK>()
          .interruptWhenTrue(IO.Concurrent)(Stream.repeat(false))
          .compileConcurrent()
          .toList.flatMap(xs => IO(() => xs.equals(Eq.primitive, s.toList)))
          .unsafeRunToPromise(),
      ),
    ));

  it('should interrupt a stream that never terminates in flatMap', () =>
    Stream(1)
      .covary<IoK>()
      .interruptWhen(IO.sleep(20).attempt)
      .flatMap(() => Stream.evalF<IoK, never>(IO.never))
      .compileConcurrent()
      .drain.unsafeRunToPromise());

  it('should do something', () => {
    const interrupt = Stream.sleep(IO.Temporal)(50).flatMap(() =>
      Stream.throwError(new TestError()),
    );
    const s = Stream(1, 2, 3);

    return Stream(1)
      .concat(s)
      .covary<IoK>()
      .interruptWhenTrue(IO.Concurrent)(interrupt)
      .evalMap(() => IO.never)
      .compileConcurrent()
      .drain.handleErrorWith(eraseTestError)
      .unsafeRunToPromise();
  });

  it('should rethrow the error thrown in the interruption signal', () =>
    fc.assert(
      fc.asyncProperty(A.fp4tsPureStreamGenerator(fc.integer()), s => {
        const interrupt = Stream.sleep(IO.Temporal)(20).flatMap(() =>
          Stream.throwError(new TestError()),
        );

        return Stream(1)
          .concat(s)
          .covary<IoK>()
          .interruptWhenTrue(IO.Concurrent)(interrupt)
          .evalMap(() => IO.never)
          .compileConcurrent()
          .drain.handleErrorWith(eraseTestError)
          .unsafeRunToPromise();
      }),
    ));

  it('should resume on concat (minimal)', () =>
    Stream.evalF<IoK, never>(IO.never)
      .interruptWhen(IO.sleep(10).attempt)
      .concat(Stream(5))
      .compileConcurrent()
      .toList.flatMap(xs => IO(() => expect(xs).toEqual(List(5))))
      .unsafeRunToPromise());

  it('should interrupt evalMap and then resume on concat', () =>
    fc.assert(
      fc.asyncProperty(A.fp4tsPureStreamGenerator(fc.integer()), s => {
        const expected = s.toList;
        const interrupt = IO.sleep(20).attempt;

        return s
          .covary<IoK>()
          .interruptWhen(interrupt)
          .evalMap(() => IO.never)
          .drain.concat(s)
          .compileConcurrent()
          .toList.map(xs => xs.equals(Eq.primitive, expected))
          .unsafeRunToPromise();
      }),
    ));

  it('should interrupt evalMap+collect and then resume on concat', () =>
    fc.assert(
      fc.asyncProperty(A.fp4tsPureStreamGenerator(fc.integer()), s => {
        const expected = s.toList;
        const interrupt = IO.sleep(20).attempt;

        return s
          .covary<IoK>()
          .interruptWhen(interrupt)
          .evalMap(() => IO.never.map(() => None))
          .drain.concat(s.map(Some))
          .collect(id)
          .compileConcurrent()
          .toList.map(xs => xs.equals(Eq.primitive, expected))
          .unsafeRunToPromise();
      }),
    ));

  it('should interrupt stream where flatMap is followed by collect', () =>
    fc.assert(
      fc.asyncProperty(A.fp4tsPureStreamGenerator(fc.integer()), s => {
        const expected = s.toList;
        const interrupt = IO.sleep(20).attempt;

        return s
          .concat(Stream(1))
          .covary<IoK>()
          .interruptWhen(interrupt)
          .map(() => None)
          .concat(s.map(Some))
          .flatMap(opt =>
            opt.fold(
              () => Stream.evalF<IoK, never>(IO.never),
              i => Stream(Some(i)),
            ),
          )
          .collect(id)
          .compileConcurrent()
          .toList.map(xs => xs.equals(Eq.primitive, expected))
          .unsafeRunToPromise();
      }),
    ));

  it('should resume on concat after evalMap hangs', () =>
    Stream(1)
      .covary<IoK>()
      .interruptWhen(IO.sleep(10).attempt)
      .evalMap(() => IO.never)
      .concat(Stream(5))
      .compileConcurrent()
      .toList.flatMap(xs => IO(() => expect(xs).toEqual(List(5))))
      .unsafeRunToPromise());

  describe('nested interrupt', () => {
    it('should interrupt outer never completing signal', () =>
      fc.assert(
        fc.asyncProperty(A.fp4tsPureStreamGenerator(fc.integer()), s => {
          const expected = s.toList;
          const interrupt = IO.sleep(20).attempt;
          const neverInterrupt = IO.never.attempt;

          return s
            .covary<IoK>()
            .interruptWhen(interrupt)
            .map(() => None)
            .concat(s.map(Some))
            .interruptWhen(neverInterrupt)
            .flatMap(opt =>
              opt.fold(
                () => Stream.evalF<IoK, never>(IO.never),
                i => Stream(Some(i)),
              ),
            )
            .collect(id)
            .compileConcurrent()
            .toList.map(xs => xs.equals(Eq.primitive, expected))
            .unsafeRunToPromise();
        }),
      ));

    it('should interrupt inner scope from the outer scope', () =>
      Stream.evalF<IoK, void>(IO.never)
        .interruptWhen(IO.never.attempt)
        .interruptWhen(IO(() => Either.rightUnit))
        .compileConcurrent()
        .toList.flatMap(xs => IO(() => expect(xs).toEqual(List.empty)))
        .unsafeRunToPromise());

    it('should recover when interrupted in enclosing scope', () =>
      Stream.evalF<IoK, number>(IO.never)
        .interruptWhen(IO.never.attempt)
        .concat(Stream(1).delayBy(IO.Temporal)(10))
        .interruptWhen(IO.pure(Either.rightUnit))
        .concat(Stream(2))
        .compileConcurrent()
        .toList.flatMap(xs => IO(() => expect(xs).toEqual(List(2))))
        .unsafeRunToPromise());
  });

  describe('sync compilation', () => {
    it('should terminate when interruption hangs', () =>
      Stream.empty<IoK>()
        .interruptWhen(IO.never.attempt)
        .compileSync(IO.Sync)
        .toList.flatMap(xs => IO(() => expect(xs).toEqual(List.empty)))
        .unsafeRunToPromise());

    it('should interrupt never terminating evaluated effect', () => {
      const s = Stream.never<IoK>(IO.Spawn).interruptWhen(IO.unit.attempt);
      const interrupt = IO.sleep(250);

      return s
        .compileSync(IO.Sync)
        .drain.race(interrupt)
        .flatMap(result => IO(() => expect(result).toEqual(Either.rightUnit)))
        .unsafeRunToPromise();
    });
  });
});
