// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import os from 'os';
import { Kind, pipe } from '@fp4ts/core';
import { Either } from '@fp4ts/cats';
import { List } from '@fp4ts/collections';
import { Async, Resource } from '@fp4ts/effect-kernel';

import { Supervisor } from './supervisor';

export interface Dispatcher<F> {
  unsafeToPromiseCancelable<A>(
    fa: Kind<F, [A]>,
  ): [Promise<A>, () => Promise<void>];

  unsafeToPromise<A>(fa: Kind<F, [A]>): Promise<A>;

  unsafeRunCancelable<A>(fa: Kind<F, [A]>): () => Promise<void>;

  unsafeRunAndForget<A>(fa: Kind<F, [A]>): void;
}

const Cpus = os.cpus().length;
const Noop: () => void = () => {};
const Open: () => void = () => {};
const Completed: Either<Error, void> = Either.rightUnit;

type CancelInit = { tag: 'init' };
type CanceledNoToken = {
  tag: 'canceledNoToken';
  pref: [() => void, (e: Error) => void, Promise<void>];
};
type CanceledToken = {
  tag: 'canceledToken';
  cancelToken: () => Promise<void>;
};
type CancelState = CancelInit | CanceledNoToken | CanceledToken;

export function Dispatcher<F>(F: Async<F>): Resource<F, Dispatcher<F>> {
  class Registration {
    public constructor(
      public readonly action: Kind<F, [void]>,
      public readonly prepareCancel: (fv: Kind<F, [void]>) => void,
      public readonly active: AtomicRef<boolean> = new AtomicRef(true),
    ) {}
  }

  const R = Resource.Async(F);

  return R.do(function* (_) {
    const supervisor = yield* _(Supervisor(F));
    const latches = yield* _(
      R.delay(() => {
        const latches = new Array<AtomicRef<() => void>>(Cpus);
        for (let i = 0; i < Cpus; i++) {
          latches[i] = new AtomicRef(Noop);
        }
        return latches;
      }),
    );
    const states = yield* _(
      R.delay(() => {
        const states = new Array<AtomicRef<List<Registration>>>(Cpus);
        for (let i = 0; i < Cpus; i++) {
          states[i] = new AtomicRef(List.empty);
        }
        return states;
      }),
    );
    const alive = yield* _(
      Resource.make(F)(
        F.delay(() => new AtomicRef(true)),
        ref => F.delay(() => ref.set(false)),
      ),
    );

    const dispatcher = (
      latch: AtomicRef<() => void>,
      state: AtomicRef<List<Registration>>,
    ): Kind<F, [void]> =>
      F.do(function* (_) {
        yield* _(F.delay(() => latch.set(Noop)));
        const rgs = yield* _(
          F.delay(() =>
            state.get().nonEmpty
              ? state.getAndSet(List.empty).reverse
              : List.empty,
          ),
        );
        const res = yield* _(
          rgs.isEmpty
            ? F.async_<void>(cb =>
                // Suspend the current dispatcher until someone invokes us
                // and completes this async effect
                !latch.compareAndSet(Noop, () => cb(Completed))
                  ? cb(Completed)
                  : void 0,
              )
            : pipe(
                F.uncancelable(() =>
                  rgs.traverse(F, ({ action, active, prepareCancel }) => {
                    const supervise: () => Kind<F, [void]> = () =>
                      pipe(
                        supervisor.supervise(action),
                        F.flatMap(f => F.delay(() => prepareCancel(f.cancel))),
                      );

                    return active.get() ? supervise() : F.unit;
                  }),
                ),
                F.void,
              ),
        );
        return res;
      });

    yield* _(
      List.range(0, Cpus).traverse(R, n =>
        pipe(dispatcher(latches[n], states[n]), F.foreverM, F.background),
      ),
    );

    const unsafeToPromiseCancelable = <E>(
      fe: Kind<F, [E]>,
    ): [Promise<E>, () => Promise<void>] => {
      let action!: Kind<F, [void]>;
      const promise = new Promise<E>((resolve, reject) => {
        action = pipe(
          fe,
          F.flatMap(e => F.delay(() => resolve(e))),
          F.onError(e => F.delay(() => reject(e))),
          F.void,
        );
      });

      let cancelState: CancelState = { tag: 'init' };

      const registerCancel = (token: Kind<F, [void]>): void => {
        const cancelToken = () => unsafeToPromise(token);

        switch (cancelState.tag) {
          case 'init':
            cancelState = { tag: 'canceledToken', cancelToken };
            break;
          case 'canceledNoToken':
            cancelToken().then(cancelState.pref[0]).catch(cancelState.pref[1]);
            cancelState = { tag: 'canceledToken', cancelToken };
            return;
          case 'canceledToken':
            return;
        }
      };

      const enqueue = (
        state: AtomicRef<List<Registration>>,
        reg: Registration,
      ): void => {
        const cur = state.get();
        const next = cur.prepend(reg);
        // No need to compare and set since we are in single threaded environment
        state.set(next);
      };

      if (alive.get()) {
        const dispatcher = Math.floor(Math.abs(Math.random() * Cpus));
        const reg = new Registration(action, fv => registerCancel(fv));
        enqueue(states[dispatcher], reg);

        const lt = latches[dispatcher];
        if (lt.get !== Open) {
          const f = lt.getAndSet(Open);
          f();
        }

        const cancel = (): Promise<void> => {
          reg.active.lazySet(false);

          switch (cancelState.tag) {
            case 'init':
              const p = new Promise<void>((resolve, reject) => {
                cancelState = {
                  tag: 'canceledNoToken',
                  pref: [resolve, reject, p],
                };
              });
              return p;

            case 'canceledNoToken':
              return cancelState.pref[2];

            case 'canceledToken':
              return cancelState.cancelToken();
          }
        };

        return [promise, cancel];
      } else {
        throw new Error('dispatcher already shut down');
      }
    };

    const unsafeToPromise = <E>(fe: Kind<F, [E]>): Promise<E> =>
      unsafeToPromiseCancelable(fe)[0];

    const unsafeRunCancelable = <E>(fe: Kind<F, [E]>): (() => Promise<void>) =>
      unsafeToPromiseCancelable(fe)[1];

    const unsafeRunAndForget = <E>(fe: Kind<F, [E]>): void => {
      unsafeToPromiseCancelable(fe);
    };

    return {
      unsafeToPromiseCancelable,
      unsafeToPromise,
      unsafeRunCancelable,
      unsafeRunAndForget,
    } as Dispatcher<F>;
  });
}

class AtomicRef<A> {
  private value: A;

  public constructor(initialValue: A) {
    this.value = initialValue;
  }

  public get(): A {
    return this.value;
  }

  public getAndSet(newValue: A): A {
    const prevValue = this.value;
    this.value = newValue;
    return prevValue;
  }

  public set(newValue: A): void {
    this.value = newValue;
  }

  public lazySet(newValue: A): void {
    setTimeout(() => this.set(newValue), 0);
  }

  public compareAndSet(prevValue: A, newValue: A): boolean {
    if (this.value === prevValue) {
      this.value = newValue;
      return true;
    } else {
      return false;
    }
  }
}
