import {
  Applicative,
  Apply,
  Defer,
  Either,
  FunctionK,
  Functor,
  Left,
  Monad,
  MonadError,
  None,
  Option,
  Parallel,
  Right,
  StackSafeMonad,
  Traversable,
} from '@fp4ts/cats';
import { $type, flow, id, Kind, Lazy, lazyVal, TyK, TyVar } from '@fp4ts/core';
import {
  Async,
  CancellationError,
  Clock,
  Concurrent,
  Cont,
  Deferred,
  ExecutionContext,
  MonadCancel,
  Poll,
  Ref,
  Resource,
  Spawn,
  Sync,
  Temporal,
  UniqueToken,
} from '@fp4ts/effect-kernel';
import { IOFiber } from './io-fiber';
import { IOOutcome } from './io-outcome';
import { Tracing, TracingEvent } from './tracing';
import { IORuntime } from './unsafe/io-runtime';

export type IO<A> = _IO<A>;
export const IO: IOObj = function <A>(thunk: () => A) {
  return new Delay(thunk);
} as any;

interface IOObj {
  <A>(thunk: () => A): IO<A>;
  pure<A>(a: A): IO<A>;
  unit: IO<void>;
  never: IO<never>;
  canceled: IO<void>;
  suspend: IO<void>;
  delay<A>(thunk: () => A): IO<A>;
  defer<A>(thunk: () => IO<A>): IO<A>;
  throwError<A = never>(e: Error): IO<A>;

  currentTimeMicros: IO<number>;
  currentTimeMillis: IO<number>;
  readExecutionContext: IO<ExecutionContext>;

  bracketFull<A, B>(
    acquire: (poll: Poll<IOF>) => IO<A>,
    use: (a: A) => IO<B>,
    release: (a: A, oc: IOOutcome<B>) => IO<void>,
  ): IO<B>;

  ref<A>(a: A): IO<Ref<IOF, A>>;
  deferred<A>(): IO<Deferred<IOF, A>>;

  race<A, B>(ioa: IO<A>, iob: IO<B>): IO<Either<A, B>>;
  raceOutcome<A, B>(
    ioa: IO<A>,
    iob: IO<B>,
  ): IO<Either<IOOutcome<A>, IOOutcome<B>>>;

  both<A, B>(ioa: IO<A>, iob: IO<B>): IO<[A, B]>;
  bothOutcome<A, B>(ioa: IO<A>, iob: IO<B>): IO<[IOOutcome<A>, IOOutcome<B>]>;

  uncancelable<A>(ioa: (p: Poll<IOF>) => IO<A>): IO<A>;
  sleep(ms: number): IO<void>;
  async<A>(
    k: (cb: (ea: Either<Error, A>) => void) => IO<Option<IO<void>>>,
  ): IO<A>;
  async_<A>(k: (cb: (ea: Either<Error, A>) => void) => void): IO<A>;

  deferPromise<A>(thunk: () => Promise<A>): IO<A>;
  fromEither<A>(ea: Either<Error, A>): IO<A>;
  fromPromise<A>(fpa: IO<Promise<A>>): IO<A>;
  cont<K, R>(body: Cont<IOF, K, R>): IO<R>;

  sequence: <T>(
    T: Traversable<T>,
  ) => <A>(iots: Kind<T, [IO<A>]>) => IO<Kind<T, [A]>>;

  traverse<T>(
    T: Traversable<T>,
  ): <A, B>(f: (a: A) => IO<B>) => (ts: Kind<T, [A]>) => IO<Kind<T, [B]>>;

  traverse_<T>(
    T: Traversable<T>,
  ): <A, B>(ts: Kind<T, [A]>, f: (a: A) => IO<B>) => IO<Kind<T, [B]>>;

  parSequence<T>(
    T: Traversable<T>,
  ): <A>(iots: Kind<T, [IO<A>]>) => IO<Kind<T, [A]>>;

  parTraverse<T>(
    T: Traversable<T>,
  ): <A, B>(f: (a: A) => IO<B>) => (ts: Kind<T, [A]>) => IO<Kind<T, [B]>>;
  parTraverse_<T>(
    T: Traversable<T>,
  ): <A, B>(ts: Kind<T, [A]>, f: (a: A) => IO<B>) => IO<Kind<T, [B]>>;

  parSequenceN<T>(
    T: Traversable<T>,
  ): (maxConcurrent: number) => <A>(iots: Kind<T, [IO<A>]>) => IO<Kind<T, [A]>>;
  parSequenceN_<T>(
    T: Traversable<T>,
  ): <A>(iots: Kind<T, [IO<A>]>, maxConcurrent: number) => IO<Kind<T, [A]>>;

  parTraverseN<T>(
    T: Traversable<T>,
  ): <A, B>(
    maxConcurrent: number,
    f: (a: A) => IO<B>,
  ) => (ts: Kind<T, [A]>) => IO<Kind<T, [B]>>;
  parTraverseN_<T>(
    T: Traversable<T>,
  ): <A>(
    ts: Kind<T, [A]>,
    maxConcurrent: number,
  ) => <B>(f: (a: A) => IO<B>) => IO<Kind<T, [B]>>;

  // -- Instances

  readonly Defer: Defer<IOF>;
  readonly Functor: Functor<IOF>;
  readonly Apply: Apply<IOF>;
  readonly Applicative: Applicative<IOF>;
  readonly Monad: Monad<IOF>;
  readonly MonadError: MonadError<IOF, Error>;
  readonly MonadCancel: MonadCancel<IOF, Error>;
  readonly Sync: Sync<IOF>;
  readonly Spawn: Spawn<IOF, Error>;
  readonly Parallel: Parallel<IOF, IOF>;
  readonly Concurrent: Concurrent<IOF, Error>;
  readonly Temporal: Temporal<IOF, Error>;
  readonly Async: Async<IOF>;
}

abstract class _IO<A> {
  private readonly __void!: void;
  private readonly _A!: () => A;

  public get fork(): IO<IOFiber<A>> {
    return new Fork(this);
  }

  public get uncancelable(): IO<A> {
    return IO.uncancelable(() => this);
  }

  public onCancel(fin: IO<void>): IO<A> {
    return new OnCancel(this, fin);
  }

  public delayBy(ms: number): IO<A> {
    return IO.sleep(ms).flatMap(() => this);
  }

  public timeout(ms: number): IO<A> {
    return this.timeoutTo(ms, IO.throwError(new Error('Timeout exceeded')));
  }

  public timeoutTo<B>(this: IO<B>, ms: number, fallback: IO<B>): IO<B> {
    return IO.sleep(ms)
      .race(this)
      .flatMap(ea => ea.fold(() => fallback, IO.pure));
  }

  public get background(): Resource<IOF, IO<IOOutcome<A>>> {
    return IO.Spawn.background(this);
  }

  public executeOn(ec: ExecutionContext): IO<A> {
    return new ExecuteOn(this, ec);
  }

  public get void(): IO<void> {
    return this.map(() => {});
  }

  public race<B>(that: IO<B>): IO<Either<A, B>> {
    return IO.Spawn.race_(this, that);
  }

  public raceOutcome<B>(that: IO<B>): IO<Either<IOOutcome<A>, IOOutcome<B>>> {
    return IO.Spawn.raceOutcome_(this, that);
  }

  /**
   * Low level primitive, prefer to use race/raceOutcome
   */
  public racePair<B>(
    that: IO<B>,
  ): IO<Either<[IOOutcome<A>, IOFiber<B>], [IOFiber<A>, IOOutcome<B>]>> {
    return new RacePair(this, that);
  }

  public both<B>(that: IO<B>): IO<[A, B]> {
    return IO.Spawn.both_(this, that);
  }

  public bothOutcome<B>(that: IO<B>): IO<[IOOutcome<A>, IOOutcome<B>]> {
    return IO.Spawn.bothOutcome_(this, that);
  }

  public finalize(fin: (oc: IOOutcome<A>) => IO<void>): IO<A> {
    return IO.uncancelable(poll =>
      poll(this)
        .onCancel(fin(IOOutcome.canceled()))
        .onError(e =>
          fin(IOOutcome.failure(e)).handleErrorWith(e2 =>
            IO.readExecutionContext.flatMap(ec =>
              IO.delay(() => ec.reportFailure(e2)),
            ),
          ),
        )
        .flatTap(a => fin(IOOutcome.success(IO.pure(a)))),
    );
  }

  public bracket<B>(
    use: (a: A) => IO<B>,
    release: (a: A, oc: IOOutcome<B>) => IO<void>,
  ): IO<B> {
    return IO.bracketFull(() => this, use, release);
  }

  public map<B>(f: (a: A) => B): IO<B> {
    return new Map(this, f);
  }

  public tap(f: (a: A) => unknown): IO<A> {
    return this.map(x => {
      f(x);
      return x;
    });
  }

  public flatMap<B>(f: (a: A) => IO<B>): IO<B> {
    return new FlatMap(this, f);
  }

  public flatTap<B>(f: (a: A) => IO<B>): IO<A> {
    return this.flatMap(x => f(x).map(() => x));
  }

  public flatten<B>(this: IO<IO<B>>): IO<B> {
    return this.flatMap(fx => fx);
  }

  public map2<B, C>(that: IO<B>, f: (a: A, b: B) => C): IO<C> {
    return this.flatMap(a => that.map(b => f(a, b)));
  }
  public product<B>(that: IO<B>): IO<[A, B]> {
    return this.map2(that, (a, b) => [a, b]);
  }
  public productL<B>(that: IO<B>): IO<A> {
    return this.map2(that, a => a);
  }
  public '<<<'<B>(that: IO<B>): IO<A> {
    return this.productL(that);
  }
  public productR<B>(that: IO<B>): IO<B> {
    return this.map2(that, (_, b) => b);
  }
  public '>>>'<B>(that: IO<B>): IO<B> {
    return this.productR(that);
  }

  public get attempt(): IO<Either<Error, A>> {
    return new Attempt(this);
  }

  public handleError<B>(this: IO<B>, h: (e: Error) => B): IO<B> {
    return this.handleErrorWith(e => IO.pure(h(e)));
  }

  public handleErrorWith<B>(this: IO<B>, h: (e: Error) => IO<B>): IO<B> {
    return new HandleErrorWith(this, h, Tracing.buildEvent());
  }

  public redeem<B>(h: (e: Error) => B, f: (a: A) => B): IO<B> {
    return this.attempt.map(ea => ea.fold(h, f));
  }

  public redeemWith<B>(h: (e: Error) => IO<B>, f: (a: A) => IO<B>): IO<B> {
    return this.attempt.flatMap(ea => ea.fold(h, f));
  }

  public onError(f: (e: Error) => IO<void>): IO<A> {
    return this.handleErrorWith(e => f(e).flatMap(() => IO.throwError(e)));
  }

  // -- Unsafe

  public unsafeRunToPromise(runtime?: IORuntime): Promise<A> {
    return new Promise((resolve, reject) =>
      this.unsafeRunAsync(ea => ea.fold(reject, resolve), runtime),
    );
  }

  public unsafeRunAsync(
    cb: (ea: Either<Error, A>) => void,
    runtime?: IORuntime,
  ): void {
    return this.unsafeRunAsyncOutcome(
      oc =>
        oc.fold(
          () => cb(Left(new CancellationError())),
          e => cb(Left(e)),
          (a: IO<A>) => cb(Right((a as Pure<A>).value)),
        ),
      runtime,
    );
  }

  public unsafeRunAsyncOutcome(
    cb: (oc: IOOutcome<A>) => void,
    runtime: IORuntime = IORuntime.global,
  ): void {
    const fiber = new IOFiber(this, runtime.executionContext, runtime);
    fiber.onComplete(cb);
    runtime.executionContext.executeAsync(() => fiber.run());
  }
}

// -- Algebra

class Pure<A> extends _IO<A> {
  public readonly tag = 0; // 'pure';
  public constructor(
    public readonly value: A,
    public readonly event?: TracingEvent,
  ) {
    super();
  }

  public override toString(): string {
    return `[Pure value: ${this.value}]`;
  }
}

class Fail extends _IO<never> {
  public readonly tag = 1; // 'fail';
  public constructor(readonly error: Error) {
    super();
  }

  public override toString(): string {
    return `[Fail error: ${this.error}]`;
  }
}

class Delay<A> extends _IO<A> {
  public readonly tag = 2;
  public constructor(
    public readonly thunk: () => A,
    public readonly event?: TracingEvent,
  ) {
    super();
  }
}

class _Defer<A> extends _IO<A> {
  public readonly tag = 3;
  public constructor(
    public readonly thunk: () => _IO<A>,
    public readonly event?: TracingEvent,
  ) {
    super();
  }
}

const CurrentTimeMicros: IO<number> & { tag: 4 } =
  new (class CurrentTimeMicros extends _IO<number> {
    public readonly tag = 4;
  })();
type CurrentTimeMicros = typeof CurrentTimeMicros;

const CurrentTimeMillis: IO<number> & { tag: 5 } =
  new (class CurrentTimeMillis extends _IO<number> {
    public readonly tag = 5;
  })();
type CurrentTimeMillis = typeof CurrentTimeMillis;

const ReadEC: IO<ExecutionContext> & { tag: 6 } =
  new (class ReadEC extends _IO<ExecutionContext> {
    public readonly tag = 6;
  })();
type ReadEC = typeof ReadEC;

class Map<E, A> extends _IO<A> {
  public readonly tag = 7;
  public constructor(
    public readonly ioe: _IO<E>,
    public readonly f: (e: E) => A,
    public readonly event?: TracingEvent,
  ) {
    super();
  }
}
class FlatMap<E, A> extends _IO<A> {
  public readonly tag = 8;
  public constructor(
    public readonly ioe: _IO<E>,
    public readonly f: (a: E) => _IO<A>,
    public readonly event?: TracingEvent,
  ) {
    super();
  }
}
class HandleErrorWith<A> extends _IO<A> {
  public readonly tag = 9;
  public constructor(
    public readonly ioa: _IO<A>,
    public readonly f: (e: Error) => _IO<A>,
    public readonly event?: TracingEvent,
  ) {
    super();
  }
}

class Attempt<A> extends _IO<Either<Error, A>> {
  public readonly tag = 10;
  public constructor(public readonly ioa: _IO<A>) {
    super();
  }
}

class Fork<A> extends _IO<IOFiber<A>> {
  public readonly tag = 11;
  public constructor(public readonly ioa: _IO<A>) {
    super();
  }
}

class OnCancel<A> extends _IO<A> {
  public readonly tag = 12;
  public constructor(
    public readonly ioa: _IO<A>,
    public readonly fin: _IO<void>,
  ) {
    super();
  }
}

const Canceled: IO<void> & { tag: 13 } = new (class Canceled extends _IO<void> {
  public readonly tag = 13;
})();
type Canceled = typeof Canceled;

class Uncancelable<A> extends _IO<A> {
  public readonly tag = 16;
  public constructor(
    public readonly body: (p: Poll<IOF>) => _IO<A>,
    public readonly event?: TracingEvent,
  ) {
    super();
  }
}

class RacePair<A, B> extends _IO<
  Either<[IOOutcome<A>, IOFiber<B>], [IOFiber<A>, IOOutcome<B>]>
> {
  public readonly tag = 18;
  public constructor(public readonly ioa: _IO<A>, public readonly iob: _IO<B>) {
    super();
  }
}

class Sleep extends _IO<void> {
  public readonly tag = 19;
  public constructor(public readonly ms: number) {
    super();
  }
}

class ExecuteOn<A> extends _IO<A> {
  public readonly tag = 20;
  public constructor(
    public readonly ioa: _IO<A>,
    public readonly ec: ExecutionContext,
  ) {
    super();
  }
}

const Suspend: IO<void> & { tag: 21 } = new (class Suspend extends _IO<void> {
  public readonly tag = 21;
})();
type Suspend = typeof Suspend;

// -- Internal algebra produced by fiber execution

export class UnmaskRunLoop<A> extends _IO<A> {
  public readonly tag = 17;
  public constructor(
    public readonly ioa: _IO<A>,
    public readonly id: number,
    public readonly fiber: IOFiber<unknown>,
  ) {
    super();
  }
}

export class IOCont<K, R> extends _IO<R> {
  public readonly tag = 14;
  public constructor(
    public readonly body: Cont<IOF, K, R>,
    public readonly event?: TracingEvent,
  ) {
    super();
  }
}

export class IOContGet<A> extends _IO<A> {
  public readonly tag = 15;
  public constructor(public readonly state: ContState) {
    super();
  }
}

export const IOEndFiber: IO<never> & { tag: 22 } =
  new (class IOEnd extends _IO<never> {
    public readonly tag = 22;
  })();
export type IOEndFiber = typeof IOEndFiber;

export enum ContStatePhase {
  Initial,
  Waiting,
  Result,
}

export class ContState {
  public constructor(
    public wasFinalizing: boolean,
    public phase: ContStatePhase = ContStatePhase.Initial,
    public result?: Either<Error, unknown>,
  ) {}
}

export type IOView<A> =
  | Pure<A>
  | Fail
  | Delay<A>
  | _Defer<A>
  | Suspend
  | Map<any, A>
  | FlatMap<any, A>
  | HandleErrorWith<A>
  | Attempt<Either<Error, A>>
  | CurrentTimeMicros
  | CurrentTimeMillis
  | ReadEC
  | IOCont<any, A>
  | IOContGet<A>
  | Fork<A>
  | Canceled
  | OnCancel<A>
  | Uncancelable<A>
  | RacePair<unknown, unknown>
  | Sleep
  | UnmaskRunLoop<A>
  | ExecuteOn<A>
  | IOEndFiber;

IO.pure = x => new Pure(x);
IO.unit = IO.pure(undefined);
IO.delay = thunk => new Delay(thunk);
IO.defer = thunk => new _Defer(thunk);
IO.throwError = e => new Fail(e);
IO.sleep = ms => new Sleep(ms);
IO.currentTimeMicros = CurrentTimeMicros;
IO.currentTimeMillis = CurrentTimeMillis;
IO.readExecutionContext = ReadEC;

IO.async = <A>(
  k: (cb: (ea: Either<Error, A>) => void) => IO<Option<IO<void>>>,
): IO<A> =>
  new IOCont(
    <G>(G: MonadCancel<G, Error>) =>
      (resume, get: Kind<G, [A]>, lift: FunctionK<IOF, G>) =>
        G.uncancelable(poll =>
          G.flatMap_(lift(k(resume)), opt =>
            opt.fold(
              () => poll(get),
              fin => G.onCancel_(poll(get), lift(fin)),
            ),
          ),
        ),
    Tracing.buildEvent(),
  );
IO.async_ = <A>(k: (cb: (ea: Either<Error, A>) => void) => void): IO<A> =>
  IO.async<A>(cb => IO.delay(() => k(cb)).map(() => None));

IO.never = IO.async(() => IO.pure(None));
IO.canceled = Canceled;
IO.suspend = Suspend;

IO.bracketFull = <A, B>(
  acquire: (poll: Poll<IOF>) => IO<A>,
  use: (a: A) => IO<B>,
  release: (a: A, oc: IOOutcome<B>) => IO<void>,
): IO<B> =>
  IO.uncancelable(poll =>
    acquire(poll).flatMap(a =>
      IO.defer(() => poll(use(a))).finalize(oc => release(a, oc)),
    ),
  );

IO.uncancelable = thunk => new Uncancelable(thunk, Tracing.buildEvent());

IO.deferPromise = <A>(thunk: () => Promise<A>): IO<A> =>
  IO.fromPromise(IO.defer(() => IO.pure(thunk())));

IO.fromEither = <A>(ea: Either<Error, A>): IO<A> =>
  ea.fold(IO.throwError, IO.pure);

IO.fromPromise = <A>(iop: IO<Promise<A>>): IO<A> =>
  iop.flatMap(p =>
    IO.async(resume =>
      IO.delay(() => {
        const onSuccess: (x: A) => void = flow(Right, resume);
        const onFailure: (e: Error) => void = flow(Left, resume);
        p.then(onSuccess, onFailure);
        return None;
      }),
    ),
  );

IO.cont = <K, R>(body: Cont<IOF, K, R>): IO<R> => new IOCont(body);

IO.ref = x => IO.Async.ref(x);
IO.deferred = () => IO.Async.deferred();

IO.race = (fa, fb) => fa.race(fb);
IO.raceOutcome = (fa, fb) => fa.raceOutcome(fb);

IO.both = (fa, fb) => fa.both(fb);
IO.bothOutcome = (fa, fb) => fa.bothOutcome(fb);

IO.sequence = T => tfs => IO.traverse_(T)(tfs, id);

IO.traverse = T => f => ts => IO.traverse_(T)(ts, f);
IO.traverse_ =
  <T>(T: Traversable<T>) =>
  <A, B>(ts: Kind<T, [A]>, f: (a: A) => IO<B>): IO<Kind<T, [B]>> =>
    IO.defer(() => T.traverse(IO.Applicative)(f)(ts));

IO.parSequence =
  <T>(T: Traversable<T>) =>
  <A>(iots: Kind<T, [IO<A>]>): IO<Kind<T, [A]>> =>
    IO.parTraverse_(T)(iots, id);

IO.parTraverse = T => f => ts => IO.parTraverse_(T)(ts, f);
IO.parTraverse_ =
  <T>(T: Traversable<T>) =>
  <A, B>(ta: Kind<T, [A]>, f: (a: A) => IO<B>): IO<Kind<T, [B]>> =>
    Parallel.parTraverse_(T, IO.Parallel)(ta, f);

IO.parSequenceN = T => maxConcurrent => iot =>
  IO.parSequenceN_(T)(iot, maxConcurrent);
IO.parSequenceN_ =
  <T>(T: Traversable<T>) =>
  <A>(tioa: Kind<T, [IO<A>]>, maxConcurrent: number): IO<Kind<T, [A]>> =>
    IO.Concurrent.parSequenceN_(T)(tioa, maxConcurrent);

IO.parTraverseN =
  <T>(T: Traversable<T>) =>
  <A, B>(maxConcurrent: number, f: (a: A) => IO<B>) =>
  (as: Kind<T, [A]>): IO<Kind<T, [B]>> =>
    IO.parTraverseN_(T)(as, maxConcurrent)(f);
IO.parTraverseN_ =
  <T>(T: Traversable<T>) =>
  <A>(ta: Kind<T, [A]>, maxConcurrent: number) =>
  <B>(f: (a: A) => IO<B>): IO<Kind<T, [B]>> =>
    IO.Concurrent.parTraverseN_(T)(ta, maxConcurrent)(f);

// -- instances

const ioDefer: Lazy<Defer<IOF>> = lazyVal(() => Defer.of({ defer: IO.defer }));

const ioFunctor: Lazy<Functor<IOF>> = lazyVal(() =>
  Functor.of({ map_: (fa, f) => fa.map(f), tap_: (fa, f) => fa.tap(f) }),
);

const ioApply: Lazy<Apply<IOF>> = lazyVal(() =>
  Apply.of({
    ...ioFunctor(),
    ap_: (ff, fa) => ff.map2(fa, (f, a) => f(a)),
  }),
);

const ioApplicative: Lazy<Applicative<IOF>> = lazyVal(() =>
  Applicative.of({
    ...ioApply(),
    pure: IO.pure,
    unit: IO.unit,
  }),
);

const ioMonad: Lazy<Monad<IOF>> = lazyVal(() =>
  StackSafeMonad.of({
    ...ioApplicative(),
    flatMap_: (fa, f) => fa.flatMap(f),
  }),
);

const ioMonadError: Lazy<MonadError<IOF, Error>> = lazyVal(() =>
  MonadError.of({
    ...ioMonad(),
    throwError: IO.throwError,
    handleError_: (fa, h) => fa.handleError(h),
    handleErrorWith_: (fa, h) => fa.handleErrorWith(h),
    attempt: fa => fa.attempt,
    onError_: (fa, f) => fa.onError(f),
    redeem_: (fa, h, f) => fa.redeem(h, f),
    redeemWith_: (fa, h, f) => fa.redeemWith(h, f),
  }),
);

const ioMonadCancel: Lazy<MonadCancel<IOF, Error>> = lazyVal(() =>
  MonadCancel.of({
    ...ioMonadError(),
    canceled: IO.canceled,
    uncancelable: IO.uncancelable,
    onCancel_: (fa, fin) => fa.onCancel(fin),
    finalize_: (fa, fin) => fa.finalize(fin),
    bracketOutcome_: (fa, use, release) => fa.bracket(use, release),
    bracketFull: IO.bracketFull,
  }),
);

const ioSync: Lazy<Sync<IOF>> = lazyVal(() =>
  Sync.of({
    ...ioMonadCancel(),
    ...Clock.of({
      applicative: ioApplicative(),
      monotonic: IO.delay(() => process.hrtime()[0]),
      realTime: IO.delay(() => Date.now()),
    }),
    ...ioDefer(),
    delay: IO.delay,
  }),
);

const ioSpawn: Lazy<Spawn<IOF, Error>> = lazyVal(() =>
  Spawn.of({
    ...ioMonadCancel(),
    unique: IO.delay(() => new UniqueToken()),
    fork: fa => fa.fork,
    never: IO.never,
    suspend: IO.suspend,
    racePair_: (fa, fb) => fa.racePair(fb),
  }),
);

const ioParallel: Lazy<Parallel<IOF, IOF>> = lazyVal(() =>
  Spawn.parallelForSpawn(ioSpawn()),
);

const ioConcurrent: Lazy<Concurrent<IOF, Error>> = lazyVal(() =>
  Concurrent.of({
    ...ioSpawn(),
    ref: a => Ref.of(ioAsync())(a),
    deferred: <A>() => Deferred.of(ioAsync())<A>(),
  }),
);

const ioTemporal: Lazy<Temporal<IOF, Error>> = lazyVal(() =>
  Temporal.of({
    ...ioConcurrent(),
    ...Clock.of({
      applicative: ioApplicative(),
      monotonic: IO.currentTimeMicros,
      realTime: IO.currentTimeMillis,
    }),
    sleep: IO.sleep,
    delayBy_: (fa, ms) => fa.delayBy(ms),
    timeoutTo_: (fa, ms, fallback) => fa.timeoutTo(ms, fallback),
    timeout_: (fa, ms) => fa.timeout(ms),
  }),
);

const ioAsync: Lazy<Async<IOF>> = lazyVal(() =>
  Async.of({
    ...ioSync(),
    ...ioTemporal(),
    async: IO.async,
    async_: IO.async_,
    never: IO.never,
    readExecutionContext: IO.readExecutionContext,
    executeOn_: (fa, ec) => fa.executeOn(ec),
    fromPromise: IO.fromPromise,
    cont: IO.cont,
  }),
);

Object.defineProperty(IO, 'Defer', {
  get(): Defer<IOF> {
    return ioDefer();
  },
});
Object.defineProperty(IO, 'Functor', {
  get(): Functor<IOF> {
    return ioFunctor();
  },
});
Object.defineProperty(IO, 'Apply', {
  get(): Apply<IOF> {
    return ioApply();
  },
});
Object.defineProperty(IO, 'Applicative', {
  get(): Applicative<IOF> {
    return ioApplicative();
  },
});
Object.defineProperty(IO, 'Monad', {
  get(): Monad<IOF> {
    return ioMonad();
  },
});
Object.defineProperty(IO, 'MonadError', {
  get(): MonadError<IOF, Error> {
    return ioMonadError();
  },
});
Object.defineProperty(IO, 'MonadCancel', {
  get(): MonadCancel<IOF, Error> {
    return ioMonadCancel();
  },
});
Object.defineProperty(IO, 'Sync', {
  get(): Sync<IOF> {
    return ioSync();
  },
});
Object.defineProperty(IO, 'Spawn', {
  get(): Spawn<IOF, Error> {
    return ioSpawn();
  },
});
Object.defineProperty(IO, 'Parallel', {
  get(): Parallel<IOF, IOF> {
    return ioParallel();
  },
});
Object.defineProperty(IO, 'Concurrent', {
  get(): Concurrent<IOF, Error> {
    return ioConcurrent();
  },
});
Object.defineProperty(IO, 'Temporal', {
  get(): Temporal<IOF, Error> {
    return ioTemporal();
  },
});
Object.defineProperty(IO, 'Async', {
  get(): Async<IOF> {
    return ioAsync();
  },
});

// -- HKT

export interface IOF extends TyK<[unknown]> {
  [$type]: _IO<TyVar<this, 0>>;
}
