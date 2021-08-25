import { Either } from '../../fp/either';
import { ExecutionContext } from '../execution-context';
import { Outcome } from '../outcome';
import { Fiber } from '../fiber';
import { IO as IOBase } from './algebra';
import { IO } from './index';

import { unit } from './constructors';
import * as ops from './operators';

export default {};

declare module './algebra' {
  interface IO<A> {
    fork: () => IO<Fiber<A>>;

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

    flatten: A extends IO<infer B> ? () => IO<B> : never;

    '>>>': <B>(iob: IO<B>) => IO<B>;
    '<<<': (iob: IO<unknown>) => IO<A>;

    handleError: <B>(h: (e: Error) => B) => IO<A | B>;

    handleErrorWith: <B>(h: (e: Error) => IO<B>) => IO<A | B>;

    onError: (h: (e: Error) => IO<void>) => IO<A>;

    attempt: () => IO<Either<Error, A>>;

    redeem: <B>(onFailure: (e: Error) => B, onSuccess: (a: A) => B) => IO<B>;
    redeemWith: <B>(
      onFailure: (e: Error) => IO<B>,
      onSuccess: (a: A) => IO<B>,
    ) => IO<B>;

    map2: <B>(iob: IO<B>) => <C>(f: (a: A, b: B) => C) => IO<C>;
  }
}

IOBase.prototype.fork = function <A>(this: IO<A>): IO<Fiber<A>> {
  return ops.fork(this);
};

IOBase.prototype.onCancel = function <A>(this: IO<A>, fin: IO<void>): IO<A> {
  return ops.onCancel_(this, fin);
};

IOBase.prototype.delayBy = function <A>(this: IO<A>, ms: number): IO<A> {
  return ops.delayBy_(this, ms);
};

IOBase.prototype.timeout = function <A>(this: IO<A>, ms: number): IO<A> {
  return ops.timeout_(this, ms);
};

IOBase.prototype.timeoutTo = function <A>(
  this: IO<A>,
  ms: number,
  fallback: IO<A>,
): IO<A> {
  return ops.timeoutTo_(this, ms, fallback);
};

IOBase.prototype.executeOn = function <A>(
  this: IO<A>,
  ec: ExecutionContext,
): IO<A> {
  return ops.executeOn_(this, ec);
};

IOBase.prototype.void = unit;

IOBase.prototype.race = function <A, B>(
  this: IO<A>,
  that: IO<B>,
): IO<Either<A, B>> {
  return ops.race_(this, that);
};

IOBase.prototype.both = function <A, B>(this: IO<A>, that: IO<B>): IO<[A, B]> {
  return ops.both_(this, that);
};

IOBase.prototype.finalize = function <A>(
  this: IO<A>,
  finalizer: (oc: Outcome<A>) => IO<void>,
): IO<A> {
  return ops.finalize_(this, finalizer);
};

IOBase.prototype.bracket = function <A, B>(
  this: IO<A>,
  use: (a: A) => IO<B>,
): (release: (a: A) => IO<void>) => IO<B> {
  return release => ops.bracket_(this, use, release);
};

IOBase.prototype.bracketOutcome = function <A, B>(
  this: IO<A>,
  use: (a: A) => IO<B>,
): (release: (a: A, oc: Outcome<B>) => IO<void>) => IO<B> {
  return release => ops.bracketOutcome_(this, use, release);
};

IOBase.prototype.map = function <A, B>(this: IO<A>, f: (a: A) => B): IO<B> {
  return ops.map_(this, f);
};

IOBase.prototype.tap = function <A>(this: IO<A>, f: (a: A) => unknown): IO<A> {
  return ops.tap_(this, f);
};

IOBase.prototype.flatMap = function <A, B>(
  this: IO<A>,
  f: (a: A) => IO<B>,
): IO<B> {
  return ops.flatMap_(this, f);
};

IOBase.prototype.flatTap = function <A>(
  this: IO<A>,
  f: (a: A) => IO<unknown>,
): IO<A> {
  return ops.flatTap_(this, f);
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
  return ops.handleError_(this, h);
};

IOBase.prototype.handleErrorWith = function <A>(
  this: IO<A>,
  h: (e: Error) => IO<A>,
): IO<A> {
  return ops.handleErrorWith_(this, h);
};

IOBase.prototype.onError = function <A>(
  this: IO<A>,
  h: (e: Error) => IO<void>,
): IO<A> {
  return ops.onError_(this, h);
};

IOBase.prototype.attempt = function <A>(this: IO<A>): IO<Either<Error, A>> {
  return ops.attempt(this);
};

IOBase.prototype.redeem = function <A, B>(
  this: IO<A>,
  onFailure: (e: Error) => B,
  onSuccess: (a: A) => B,
): IO<B> {
  return ops.redeem_(this, onFailure, onSuccess);
};

IOBase.prototype.redeemWith = function <A, B>(
  this: IO<A>,
  onFailure: (e: Error) => IO<B>,
  onSuccess: (a: A) => IO<B>,
): IO<B> {
  return ops.redeemWith_(this, onFailure, onSuccess);
};

IOBase.prototype.map2 = function <A, B>(
  this: IO<A>,
  that: IO<B>,
): <C>(f: (a: A, b: B) => C) => IO<C> {
  return f => ops.map2_(this, that, f);
};
