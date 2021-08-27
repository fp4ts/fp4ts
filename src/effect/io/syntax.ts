import { Either } from '../../fp/either';
import { ExecutionContext } from '../execution-context';

import { Outcome } from '../kernel/outcome';
import { Fiber } from '../kernel/fiber';
import { IORuntime } from '../unsafe/io-runtime';

import { IO as IOBase } from './algebra';
import { IO } from './index';

import {
  fork,
  attempt,
  map_,
  tap_,
  both_,
  map2_,
  race_,
  redeem_,
  flatMap_,
  onError_,
  bracket_,
  delayBy_,
  flatTap_,
  timeout_,
  onCancel_,
  finalize_,
  executeOn_,
  timeoutTo_,
  redeemWith_,
  handleError_,
  bracketOutcome_,
  handleErrorWith_,
  flatten,
} from './operators';
import {
  unsafeRunAsyncOutcome_,
  unsafeRunAsync_,
  unsafeRunToPromise_,
} from './unsafe';
import { uncancelable } from './constructors';

declare module './algebra' {
  interface IO<A> {
    fork: IO<Fiber<A>>;

    onCancel: (fin: IO<void>) => IO<A>;

    delayBy: (ms: number) => IO<A>;

    timeout: (ms: number) => IO<A>;

    timeoutTo: <B>(ms: number, iob: IO<B>) => IO<A | B>;

    executeOn: (ec: ExecutionContext) => IO<A>;

    void: IO<void>;

    race: <B>(iob: IO<B>) => IO<Either<A, B>>;

    both: <B>(iob: IO<B>) => IO<[A, B]>;

    finalize: (fin: (oc: Outcome<A>) => IO<void>) => IO<A>;

    bracket: <B>(
      use: (a: A) => IO<B>,
    ) => (release: (a: A) => IO<void>) => IO<B>;

    bracketOutcome: <B>(
      use: (a: A) => IO<B>,
    ) => (release: (a: A, oc: Outcome<B>) => IO<void>) => IO<B>;

    map: <B>(f: (a: A) => B) => IO<B>;

    tap: (f: (a: A) => unknown) => IO<A>;

    flatMap: <B>(f: (a: A) => IO<B>) => IO<B>;

    flatTap: (f: (a: A) => IO<unknown>) => IO<A>;

    flatten: A extends IO<infer B> ? IO<B> : never | unknown;

    '>>>': <B>(iob: IO<B>) => IO<B>;
    '<<<': (iob: IO<unknown>) => IO<A>;

    handleError: <B>(h: (e: Error) => B) => IO<A | B>;

    handleErrorWith: <B>(h: (e: Error) => IO<B>) => IO<A | B>;

    onError: (h: (e: Error) => IO<void>) => IO<A>;

    attempt: IO<Either<Error, A>>;

    redeem: <B>(onFailure: (e: Error) => B, onSuccess: (a: A) => B) => IO<B>;
    redeemWith: <B>(
      onFailure: (e: Error) => IO<B>,
      onSuccess: (a: A) => IO<B>,
    ) => IO<B>;

    uncancelable: IO<A>;

    map2: <B>(iob: IO<B>) => <C>(f: (a: A, b: B) => C) => IO<C>;

    unsafeRunToPromise: (runtime?: IORuntime) => Promise<A>;

    unsafeRunOutcomeToPromise: (runtime?: IORuntime) => Promise<Outcome<A>>;

    unsafeRunAsync: (
      cb: (ea: Either<Error, A>) => void,
      runtime?: IORuntime,
    ) => void;

    unsafeRunAsyncOutcome: (
      cb: (oc: Outcome<A>) => void,
      runtime?: IORuntime,
    ) => void;
  }
}

Object.defineProperty(IOBase.prototype, 'fork', {
  get<A>(this: IO<A>): IO<Fiber<A>> {
    return fork(this);
  },
});

IOBase.prototype.onCancel = function <A>(this: IO<A>, fin: IO<void>): IO<A> {
  return onCancel_(this, fin);
};

IOBase.prototype.delayBy = function <A>(this: IO<A>, ms: number): IO<A> {
  return delayBy_(this, ms);
};

IOBase.prototype.timeout = function <A>(this: IO<A>, ms: number): IO<A> {
  return timeout_(this, ms);
};

IOBase.prototype.timeoutTo = function <A>(
  this: IO<A>,
  ms: number,
  fallback: IO<A>,
): IO<A> {
  return timeoutTo_(this, ms, fallback);
};

IOBase.prototype.executeOn = function <A>(
  this: IO<A>,
  ec: ExecutionContext,
): IO<A> {
  return executeOn_(this, ec);
};

Object.defineProperty(IOBase.prototype, 'void', {
  get(this: IO<unknown>): IO<void> {
    return map_(this, () => {});
  },
});

IOBase.prototype.race = function <A, B>(
  this: IO<A>,
  that: IO<B>,
): IO<Either<A, B>> {
  return race_(this, that);
};

IOBase.prototype.both = function <A, B>(this: IO<A>, that: IO<B>): IO<[A, B]> {
  return both_(this, that);
};

IOBase.prototype.finalize = function <A>(
  this: IO<A>,
  finalizer: (oc: Outcome<A>) => IO<void>,
): IO<A> {
  return finalize_(this, finalizer);
};

IOBase.prototype.bracket = function <A, B>(
  this: IO<A>,
  use: (a: A) => IO<B>,
): (release: (a: A) => IO<void>) => IO<B> {
  return release => bracket_(this, use, release);
};

IOBase.prototype.bracketOutcome = function <A, B>(
  this: IO<A>,
  use: (a: A) => IO<B>,
): (release: (a: A, oc: Outcome<B>) => IO<void>) => IO<B> {
  return release => bracketOutcome_(this, use, release);
};

IOBase.prototype.map = function <A, B>(this: IO<A>, f: (a: A) => B): IO<B> {
  return map_(this, f);
};

IOBase.prototype.tap = function <A>(this: IO<A>, f: (a: A) => unknown): IO<A> {
  return tap_(this, f);
};

IOBase.prototype.flatMap = function <A, B>(
  this: IO<A>,
  f: (a: A) => IO<B>,
): IO<B> {
  return flatMap_(this, f);
};

Object.defineProperty(IOBase.prototype, 'flatten', {
  get<A>(this: IO<IO<A>>): IO<A> {
    return flatten(this);
  },
});

IOBase.prototype.flatTap = function <A>(
  this: IO<A>,
  f: (a: A) => IO<unknown>,
): IO<A> {
  return flatTap_(this, f);
};

IOBase.prototype['>>>'] = function <A, B>(this: IO<A>, that: IO<B>): IO<B> {
  return this.flatMap(() => that);
};

IOBase.prototype['<<<'] = function <A>(this: IO<A>, that: IO<unknown>): IO<A> {
  return this.flatMap(a => that.map(() => a));
};

IOBase.prototype.handleError = function <A>(
  this: IO<A>,
  h: (e: Error) => A,
): IO<A> {
  return handleError_(this, h);
};

IOBase.prototype.handleErrorWith = function <A>(
  this: IO<A>,
  h: (e: Error) => IO<A>,
): IO<A> {
  return handleErrorWith_(this, h);
};

IOBase.prototype.onError = function <A>(
  this: IO<A>,
  h: (e: Error) => IO<void>,
): IO<A> {
  return onError_(this, h);
};

Object.defineProperty(IOBase.prototype, 'attempt', {
  get<A>(this: IO<A>): IO<Either<Error, A>> {
    return attempt(this);
  },
});

IOBase.prototype.redeem = function <A, B>(
  this: IO<A>,
  onFailure: (e: Error) => B,
  onSuccess: (a: A) => B,
): IO<B> {
  return redeem_(this, onFailure, onSuccess);
};

IOBase.prototype.redeemWith = function <A, B>(
  this: IO<A>,
  onFailure: (e: Error) => IO<B>,
  onSuccess: (a: A) => IO<B>,
): IO<B> {
  return redeemWith_(this, onFailure, onSuccess);
};

Object.defineProperty(IOBase.prototype, 'uncancelable', {
  get<A>(this: IO<A>): IO<A> {
    return uncancelable(() => this);
  },
});

IOBase.prototype.map2 = function <A, B>(
  this: IO<A>,
  that: IO<B>,
): <C>(f: (a: A, b: B) => C) => IO<C> {
  return f => map2_(this, that, f);
};

IOBase.prototype.unsafeRunToPromise = function <A>(
  this: IO<A>,
  runtime?: IORuntime,
): Promise<A> {
  return unsafeRunToPromise_(this, runtime);
};

IOBase.prototype.unsafeRunAsync = function <A>(
  this: IO<A>,
  cb: (ea: Either<Error, A>) => void,
  runtime?: IORuntime,
): void {
  unsafeRunAsync_(this, cb, runtime);
};

IOBase.prototype.unsafeRunAsyncOutcome = function <A>(
  this: IO<A>,
  cb: (oc: Outcome<A>) => void,
  runtime?: IORuntime,
): void {
  unsafeRunAsyncOutcome_(this, cb, runtime);
};
