// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $type, HKT, Lazy, lazy, TyK, TyVar } from '@fp4ts/core';
import {
  Applicative,
  Apply,
  Defer,
  Either,
  Functor,
  Left,
  Monad,
  MonadError,
  Right,
  StackSafeMonad,
} from '@fp4ts/cats';
import { Clock, MonadCancel, Sync } from '@fp4ts/effect-kernel';

export type SyncIO<A> = _SyncIO<A>;

export const SyncIO: SyncIOObj = function <A>(thunk: () => A): SyncIO<A> {
  return new Delay(thunk);
} as any;

interface SyncIOObj {
  <A>(thunk: () => A): SyncIO<A>;
  readonly unit: SyncIO<void>;
  pure<A>(a: A): SyncIO<A>;
  delay<A>(thunk: () => A): SyncIO<A>;
  defer<A>(thunk: () => SyncIO<A>): SyncIO<A>;
  throwError<A = never>(e: Error): SyncIO<A>;

  // -- Instances

  readonly Functor: Functor<SyncIOF>;
  readonly Apply: Apply<SyncIOF>;
  readonly Applicative: Applicative<SyncIOF>;
  readonly Monad: Monad<SyncIOF>;
  readonly MonadError: MonadError<SyncIOF, Error>;
  readonly Sync: Sync<SyncIOF>;
}

abstract class _SyncIO<out A> {
  private readonly __void!: void;
  private readonly _A!: () => A;

  public get void(): SyncIO<void> {
    return this.map(() => {});
  }

  public get attempt(): SyncIO<Either<Error, A>> {
    return new Attempt(this);
  }

  public redeem<B>(h: (e: Error) => B, f: (a: A) => B): SyncIO<B> {
    return this.attempt.map(ea => ea.fold(h, f));
  }

  public redeemWith<B>(
    h: (e: Error) => SyncIO<B>,
    f: (a: A) => SyncIO<B>,
  ): SyncIO<B> {
    return this.attempt.flatMap(ea => ea.fold(h, f));
  }

  public handleError<B>(this: SyncIO<B>, h: (e: Error) => B): SyncIO<B> {
    return new HandleErrorWith(this, e => SyncIO.pure(h(e)));
  }
  public handleErrorWith<B>(
    this: SyncIO<B>,
    h: (e: Error) => SyncIO<B>,
  ): SyncIO<B> {
    return new HandleErrorWith(this, h);
  }

  public map<B>(f: (a: A) => B): SyncIO<B> {
    return new Map(this, f);
  }

  public map2<B, C>(that: SyncIO<B>, f: (a: A, b: B) => C): SyncIO<C> {
    return this.flatMap(a => that.map(b => f(a, b)));
  }

  public flatMap<B>(f: (a: A) => SyncIO<B>): SyncIO<B> {
    return new _FlatMap(this, f);
  }

  public unsafeRunSync(): A {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let _cur: SyncIO<unknown> = this;
    const stack: unknown[] = [];
    const conts: Continuation[] = [];

    runLoop: while (true) {
      let tag: 'success' | 'failure';
      let result: unknown;

      while (true) {
        const cur = view(_cur);
        switch (cur.tag) {
          // Pure
          case 0:
            tag = 'success';
            result = cur.value;
            break;

          // Fail
          case 1:
            tag = 'failure';
            result = cur.error;
            break;

          // Delay
          case 2:
            try {
              tag = 'success';
              result = cur.thunk();
              break;
            } catch (e) {
              tag = 'failure';
              result = e;
              break;
            }

          // Defer
          case 3:
            try {
              _cur = cur.thunk();
              continue;
            } catch (e) {
              tag = 'failure';
              result = e;
              break;
            }

          // Map
          case 4: {
            const ioe = cur.self as View<unknown>;
            const f = cur.fun;

            switch (ioe.tag) {
              // Pure
              case 0:
                try {
                  tag = 'success';
                  result = f(ioe.value);
                  break;
                } catch (e) {
                  tag = 'failure';
                  result = e;
                  break;
                }

              // Fail
              case 1:
                tag = 'failure';
                result = ioe.error;
                break;

              // Delay
              case 2:
                try {
                  tag = 'success';
                  result = f(ioe.thunk());
                  break;
                } catch (e) {
                  tag = 'failure';
                  result = e;
                  break;
                }

              default:
                stack.push(f);
                conts.push(Continuation.MapK);
                _cur = ioe;
                continue;
            }
            break;
          }

          // FlatMap
          case 5: {
            const ioe = cur.self as View<unknown>;
            const f = cur.fun as (u: unknown) => SyncIO<unknown>;

            switch (ioe.tag) {
              // Pure
              case 0:
                try {
                  _cur = f(ioe.value);
                  continue;
                } catch (e) {
                  tag = 'failure';
                  result = e;
                  break;
                }

              // Fail
              case 1:
                tag = 'failure';
                result = ioe.error;
                break;

              // Delay
              case 2:
                try {
                  _cur = f(ioe.thunk());
                  continue;
                } catch (e) {
                  tag = 'failure';
                  result = e;
                  break;
                }

              default:
                stack.push(f);
                conts.push(Continuation.FlatMapK);
                _cur = ioe;
                continue;
            }
            break;
          }

          // Attempt
          case 6: {
            const ioa = cur.self as View<unknown>;

            switch (ioa.tag) {
              // Pure
              case 0:
                tag = 'success';
                result = Right(ioa.value);
                break;

              // Fail
              case 1:
                tag = 'success';
                result = Left(ioa.error);
                break;

              // Delay
              case 2:
                try {
                  tag = 'success';
                  result = Right(ioa.thunk());
                  break;
                } catch (e) {
                  tag = 'failure';
                  result = Left(e);
                  break;
                }

              default:
                conts.push(Continuation.AttemptK);
                _cur = cur.self;
                continue;
            }
            break;
          }

          // HandleErrorWith
          case 7:
            stack.push(cur.fun);
            conts.push(Continuation.HandleErrorWithK);
            _cur = cur.self;
            continue;
        }

        resultLoop: while (true) {
          if (tag === 'success') {
            let v: unknown = result;

            while (true) {
              if (conts.length <= 0) return v as A;
              const c = conts.pop()!;

              switch (c) {
                case 0:
                  try {
                    const f = stack.pop()! as (u: unknown) => unknown;
                    v = f(v);
                    continue;
                  } catch (e) {
                    tag = 'failure';
                    result = e;
                    continue resultLoop;
                  }

                case 1:
                  try {
                    const f = stack.pop()! as (u: unknown) => SyncIO<unknown>;
                    _cur = f(v);
                    continue runLoop;
                  } catch (e) {
                    tag = 'failure';
                    result = e;
                    continue resultLoop;
                  }

                case 2:
                  stack.pop(); // skip over error handlers
                  continue;

                case 3:
                  v = Right(v);
                  continue;
              }
            }
          } else {
            let e = result as Error;

            while (true) {
              if (conts.length <= 0) throw e;
              const c = conts.pop()!;
              switch (c) {
                case 0:
                case 1:
                  stack.pop(); // skip over success transformations
                  continue;

                case 2:
                  try {
                    const h = stack.pop()! as (e: Error) => SyncIO<unknown>;
                    _cur = h(e);
                    continue runLoop;
                  } catch (error) {
                    e = error as Error;
                    continue;
                  }

                case 3:
                  tag = 'success';
                  result = Left(e);
                  continue resultLoop;
              }
            }
          }
        }
      }
    }
  }
}

SyncIO.pure = x => new Pure(x);
Object.defineProperty(SyncIO, 'unit', {
  get() {
    return SyncIO.pure(undefined);
  },
});
SyncIO.delay = thunk => new Delay(thunk);
SyncIO.defer = thunk => new _Defer(thunk);
SyncIO.throwError = e => new Fail(e);

Object.defineProperty(SyncIO, 'Functor', {
  get() {
    return syncIoFunctor();
  },
});
Object.defineProperty(SyncIO, 'Apply', {
  get() {
    return syncIoApply();
  },
});
Object.defineProperty(SyncIO, 'Applicative', {
  get() {
    return syncIoApplicative();
  },
});
Object.defineProperty(SyncIO, 'Monad', {
  get() {
    return syncIoMonad();
  },
});
Object.defineProperty(SyncIO, 'MonadError', {
  get() {
    return syncIoMonadError();
  },
});
Object.defineProperty(SyncIO, 'Sync', {
  get() {
    return syncIoSync();
  },
});

// -- Algebra

class Pure<A> extends _SyncIO<A> {
  public readonly tag = 0;
  public constructor(public readonly value: A) {
    super();
  }
}

class Fail extends _SyncIO<never> {
  public readonly tag = 1;
  public constructor(public readonly error: Error) {
    super();
  }
}

class Delay<A> extends _SyncIO<A> {
  public readonly tag = 2;
  public constructor(public readonly thunk: () => A) {
    super();
  }
}

class _Defer<A> extends _SyncIO<A> {
  public readonly tag = 3;
  public constructor(public readonly thunk: () => SyncIO<A>) {
    super();
  }
}

class Map<E, A> extends _SyncIO<A> {
  public readonly tag = 4;
  public constructor(
    public readonly self: SyncIO<E>,
    public readonly fun: (e: E) => A,
  ) {
    super();
  }
}

class _FlatMap<E, A> extends _SyncIO<A> {
  public readonly tag = 5;
  public constructor(
    public readonly self: SyncIO<E>,
    public readonly fun: (e: E) => SyncIO<A>,
  ) {
    super();
  }
}

class Attempt<A> extends _SyncIO<Either<Error, A>> {
  public readonly tag = 6;
  public constructor(public readonly self: SyncIO<A>) {
    super();
  }
}

class HandleErrorWith<A> extends _SyncIO<A> {
  public readonly tag = 7;
  public constructor(
    public readonly self: SyncIO<A>,
    public readonly fun: (e: Error) => SyncIO<A>,
  ) {
    super();
  }
}

type View<A> =
  | Pure<A>
  | Fail
  | Delay<A>
  | _Defer<A>
  | Map<any, A>
  | _FlatMap<any, A>
  | HandleErrorWith<A>
  | Attempt<A>;

const view = <A>(_: SyncIO<A>): View<A> => _ as any;

const MapK = 0;
const FlatMapK = 1;
const HandleErrorWithK = 2;
const AttemptK = 3;

enum Continuation {
  MapK,
  FlatMapK,
  HandleErrorWithK,
  AttemptK,
}

// -- instances

const syncIoDefer: Lazy<Defer<SyncIOF>> = lazy(() =>
  Defer.of({ defer: SyncIO.defer }),
);

const syncIoFunctor: Lazy<Functor<SyncIOF>> = lazy(() =>
  Functor.of({ map_: (fa, f) => fa.map(f) }),
);

const syncIoApply: Lazy<Apply<SyncIOF>> = lazy(() =>
  Apply.of({
    ...syncIoFunctor(),
    ap_: (ff, fa) => ff.flatMap(f => fa.map(a => f(a))),
    map2_: (fa, fb, f) => fa.map2(fb, f),
  }),
);

const syncIoApplicative: Lazy<Applicative<SyncIOF>> = lazy(() =>
  Applicative.of({
    ...syncIoFunctor(),
    ...syncIoApply(),
    pure: SyncIO.pure,
    map2_: (fa, fb, f) => fa.flatMap(a => fb.map(b => f(a, b))),
  }),
);

const syncIoMonad: Lazy<Monad<SyncIOF>> = lazy(() =>
  StackSafeMonad.of({
    ...syncIoApplicative(),
    ...syncIoDefer(),
    flatMap_: (fa, f) => fa.flatMap(f),
  }),
);

const syncIoMonadError: Lazy<MonadError<SyncIOF, Error>> = lazy(() =>
  MonadError.of({
    ...syncIoMonad(),
    throwError: SyncIO.throwError,
    handleError_: (fa, h) => fa.handleError(h),
    handleErrorWith_: (fa, h) => fa.handleErrorWith(h),
    redeem_: (fa, h, f) => fa.redeem(h, f),
    redeemWith_: (fa, h, f) => fa.redeemWith(h, f),
  }),
);

const syncIoSync: Lazy<Sync<SyncIOF>> = lazy(() =>
  Sync.of({
    ...MonadCancel.Uncancelable(syncIoMonadError()),
    ...Clock.of({
      applicative: syncIoApplicative(),
      monotonic: SyncIO(() => process.hrtime()[0]),
      realTime: SyncIO(() => Date.now()),
    }),
    ...syncIoDefer(),
    delay: SyncIO.delay,
  }),
);

// -- HKT

interface _SyncIO<A> extends HKT<SyncIOF, [A]> {}

export interface SyncIOF extends TyK<[unknown]> {
  [$type]: SyncIO<TyVar<this, 0>>;
}
