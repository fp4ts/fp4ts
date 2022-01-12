// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Either } from '@fp4ts/cats';
import { ExecutionContext, Resource } from '@fp4ts/effect-kernel';

import { IOFiber } from '../io-fiber';

import { IORuntime } from '../unsafe/io-runtime';

import { IOOutcome } from '../io-outcome';
import { IO } from './algebra';

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
  background,
} from './operators';
import {
  unsafeRunAsyncOutcome_,
  unsafeRunAsync_,
  unsafeRunToPromise_,
} from './unsafe';
import { uncancelable } from './constructors';
import type { IoK } from './io';

declare module './algebra' {
  interface IO<A> {
    readonly fork: IO<IOFiber<A>>;

    onCancel: (fin: IO<void>) => IO<A>;

    delayBy: (ms: number) => IO<A>;

    timeout: (ms: number) => IO<A>;

    timeoutTo: <B = A>(ms: number, iob: IO<B>) => IO<B>;

    readonly background: Resource<IoK, IO<IOOutcome<A>>>;

    executeOn: (ec: ExecutionContext) => IO<A>;

    readonly void: IO<void>;

    race: <B>(iob: IO<B>) => IO<Either<A, B>>;

    both: <B>(iob: IO<B>) => IO<[A, B]>;

    finalize: (fin: (oc: IOOutcome<A>) => IO<void>) => IO<A>;

    bracket: <B>(
      use: (a: A) => IO<B>,
    ) => (release: (a: A) => IO<void>) => IO<B>;

    bracketOutcome: <B>(
      use: (a: A) => IO<B>,
    ) => (release: (a: A, oc: IOOutcome<B>) => IO<void>) => IO<B>;

    map: <B>(f: (a: A) => B) => IO<B>;

    tap: (f: (a: A) => unknown) => IO<A>;

    flatMap: <B>(f: (a: A) => IO<B>) => IO<B>;

    flatTap: (f: (a: A) => IO<unknown>) => IO<A>;

    readonly flatten: A extends IO<infer B> ? IO<B> : never | unknown;

    '>>>': <B>(iob: IO<B>) => IO<B>;
    '<<<': (iob: IO<unknown>) => IO<A>;

    handleError: <B = A>(h: (e: Error) => B) => IO<B>;

    handleErrorWith: <B = A>(h: (e: Error) => IO<B>) => IO<B>;

    onError: (h: (e: Error) => IO<void>) => IO<A>;

    readonly attempt: IO<Either<Error, A>>;

    redeem: <B>(onFailure: (e: Error) => B, onSuccess: (a: A) => B) => IO<B>;
    redeemWith: <B>(
      onFailure: (e: Error) => IO<B>,
      onSuccess: (a: A) => IO<B>,
    ) => IO<B>;

    readonly uncancelable: IO<A>;

    map2: <B>(iob: IO<B>) => <C>(f: (a: A, b: B) => C) => IO<C>;

    unsafeRunToPromise: (runtime?: IORuntime) => Promise<A>;

    unsafeRunOutcomeToPromise: (runtime?: IORuntime) => Promise<IOOutcome<A>>;

    unsafeRunAsync: (
      cb: (ea: Either<Error, A>) => void,
      runtime?: IORuntime,
    ) => void;

    unsafeRunAsyncOutcome: (
      cb: (oc: IOOutcome<A>) => void,
      runtime?: IORuntime,
    ) => void;
  }
}

Object.defineProperty(IO.prototype, 'fork', {
  get<A>(this: IO<A>): IO<IOFiber<A>> {
    return fork(this);
  },
});

IO.prototype.onCancel = function <A>(this: IO<A>, fin: IO<void>): IO<A> {
  return onCancel_(this, fin);
};

IO.prototype.delayBy = function <A>(this: IO<A>, ms: number): IO<A> {
  return delayBy_(this, ms);
};

IO.prototype.timeout = function <A>(this: IO<A>, ms: number): IO<A> {
  return timeout_(this, ms);
};

IO.prototype.timeoutTo = function <A>(
  this: IO<A>,
  ms: number,
  fallback: IO<A>,
): IO<A> {
  return timeoutTo_(this, ms, fallback);
};

Object.defineProperty(IO.prototype, 'background', {
  get<A>(this: IO<A>): Resource<IoK, IO<IOOutcome<A>>> {
    return background(this);
  },
});

IO.prototype.executeOn = function <A>(
  this: IO<A>,
  ec: ExecutionContext,
): IO<A> {
  return executeOn_(this, ec);
};

Object.defineProperty(IO.prototype, 'void', {
  get(this: IO<unknown>): IO<void> {
    return map_(this, () => {});
  },
});

IO.prototype.race = function <A, B>(
  this: IO<A>,
  that: IO<B>,
): IO<Either<A, B>> {
  return race_(this, that);
};

IO.prototype.both = function <A, B>(this: IO<A>, that: IO<B>): IO<[A, B]> {
  return both_(this, that);
};

IO.prototype.finalize = function <A>(
  this: IO<A>,
  finalizer: (oc: IOOutcome<A>) => IO<void>,
): IO<A> {
  return finalize_(this, finalizer);
};

IO.prototype.bracket = function <A, B>(
  this: IO<A>,
  use: (a: A) => IO<B>,
): (release: (a: A) => IO<void>) => IO<B> {
  return release => bracket_(this, use, release);
};

IO.prototype.bracketOutcome = function <A, B>(
  this: IO<A>,
  use: (a: A) => IO<B>,
): (release: (a: A, oc: IOOutcome<B>) => IO<void>) => IO<B> {
  return release => bracketOutcome_(this, use, release);
};

IO.prototype.map = function <A, B>(this: IO<A>, f: (a: A) => B): IO<B> {
  return map_(this, f);
};

IO.prototype.tap = function <A>(this: IO<A>, f: (a: A) => unknown): IO<A> {
  return tap_(this, f);
};

IO.prototype.flatMap = function <A, B>(this: IO<A>, f: (a: A) => IO<B>): IO<B> {
  return flatMap_(this, f);
};

Object.defineProperty(IO.prototype, 'flatten', {
  get<A>(this: IO<IO<A>>): IO<A> {
    return flatten(this);
  },
});

IO.prototype.flatTap = function <A>(
  this: IO<A>,
  f: (a: A) => IO<unknown>,
): IO<A> {
  return flatTap_(this, f);
};

IO.prototype['>>>'] = function <A, B>(this: IO<A>, that: IO<B>): IO<B> {
  return this.flatMap(() => that);
};

IO.prototype['<<<'] = function <A>(this: IO<A>, that: IO<unknown>): IO<A> {
  return this.flatMap(a => that.map(() => a));
};

IO.prototype.handleError = function <A>(
  this: IO<A>,
  h: (e: Error) => A,
): IO<A> {
  return handleError_(this, h);
};

IO.prototype.handleErrorWith = function <A>(
  this: IO<A>,
  h: (e: Error) => IO<A>,
): IO<A> {
  return handleErrorWith_(this, h);
};

IO.prototype.onError = function <A>(
  this: IO<A>,
  h: (e: Error) => IO<void>,
): IO<A> {
  return onError_(this, h);
};

Object.defineProperty(IO.prototype, 'attempt', {
  get<A>(this: IO<A>): IO<Either<Error, A>> {
    return attempt(this);
  },
});

IO.prototype.redeem = function <A, B>(
  this: IO<A>,
  onFailure: (e: Error) => B,
  onSuccess: (a: A) => B,
): IO<B> {
  return redeem_(this, onFailure, onSuccess);
};

IO.prototype.redeemWith = function <A, B>(
  this: IO<A>,
  onFailure: (e: Error) => IO<B>,
  onSuccess: (a: A) => IO<B>,
): IO<B> {
  return redeemWith_(this, onFailure, onSuccess);
};

Object.defineProperty(IO.prototype, 'uncancelable', {
  get<A>(this: IO<A>): IO<A> {
    return uncancelable(() => this);
  },
});

IO.prototype.map2 = function <A, B>(
  this: IO<A>,
  that: IO<B>,
): <C>(f: (a: A, b: B) => C) => IO<C> {
  return f => map2_(this, that, f);
};

IO.prototype.unsafeRunToPromise = function <A>(
  this: IO<A>,
  runtime?: IORuntime,
): Promise<A> {
  return unsafeRunToPromise_(this, runtime);
};

IO.prototype.unsafeRunAsync = function <A>(
  this: IO<A>,
  cb: (ea: Either<Error, A>) => void,
  runtime?: IORuntime,
): void {
  unsafeRunAsync_(this, cb, runtime);
};

IO.prototype.unsafeRunAsyncOutcome = function <A>(
  this: IO<A>,
  cb: (oc: IOOutcome<A>) => void,
  runtime?: IORuntime,
): void {
  unsafeRunAsyncOutcome_(this, cb, runtime);
};
