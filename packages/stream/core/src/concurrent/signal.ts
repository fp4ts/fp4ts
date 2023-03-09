// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, pipe, tupled } from '@fp4ts/core';
import { OrdMap } from '@fp4ts/collections';
import { Ref, Concurrent, Deferred } from '@fp4ts/effect';
import { Stream } from '../stream';

export interface Signal<F, A> {
  discrete(): Stream<F, A>;
  continuous(): Stream<F, A>;
  get(): Kind<F, [A]>;
}

export interface SignallingRef<F, A> extends Ref<F, A>, Signal<F, A> {}

export const SignallingRef = function <F>(F: Concurrent<F, Error>) {
  return <A>(initial: A): Kind<F, [SignallingRef<F, A>]> =>
    F.do(function* (_) {
      const state = yield* _(F.ref(new State<F, A>(initial, 0, OrdMap.empty)));
      const ids = yield* _(F.ref(0));
      const newId = ids.updateAndGet(x => x + 1);

      return new SignallingRefImpl(F, state, newId);
    });
};

class SignallingRefImpl<F, A> extends Ref<F, A> implements Signal<F, A> {
  public constructor(
    private readonly F: Concurrent<F, Error>,
    private readonly state: Ref<F, State<F, A>>,
    private readonly newId: Kind<F, [number]>,
  ) {
    super();
  }

  public discrete = (): Stream<F, A> => {
    const { F } = this;
    const go = (id: number, lastSeen: number): Stream<F, A> => {
      const getNext: Kind<F, [[A, number]]> = pipe(
        F.deferred<[A, number]>(),
        F.flatMap(wait =>
          this.state.modify(s =>
            s.lastUpdate !== lastSeen
              ? [s, F.pure(tupled(s.value, s.lastUpdate))]
              : [
                  s.copy({ listeners: s.listeners.insert(id, wait) }),
                  wait.get(),
                ],
          ),
        ),
        F.flatten,
      );

      return Stream.evalF(getNext).flatMap(([a, lastUpdate]) =>
        Stream.pure<F, A>(a)['+++'](go(id, lastUpdate)),
      );
    };

    const cleanup = (id: number): Kind<F, [void]> =>
      this.state.update(s => s.copy({ listeners: s.listeners.remove(id) }));

    return Stream.bracket(this.newId, cleanup).flatMap(id =>
      Stream.evalF(this.state.get()).flatMap(state =>
        Stream.pure<F, A>(state.value)['+++'](go(id, state.lastUpdate)),
      ),
    );
  };
  public continuous = (): Stream<F, A> => Stream.repeatEval(this.get());

  public get(): Kind<F, [A]> {
    return this.F.map_(this.state.get(), s => s.value);
  }

  public set(x: A): Kind<F, [void]> {
    return this.update(() => x);
  }

  public update(f: (a: A) => A): Kind<F, [void]> {
    return this.modify(a => [f(a), undefined]);
  }

  public updateAndGet(f: (a: A) => A): Kind<F, [A]> {
    return this.modify(a => {
      const newResult = f(a);
      return [newResult, newResult];
    });
  }

  private updateAndNotify = <B>(
    state: State<F, A>,
    f: (a: A) => [A, B],
  ): [State<F, A>, Kind<F, [B]>] => {
    const [newValue, result] = f(state.value);
    const lastUpdate = state.lastUpdate + 1;
    const newState = new State<F, A>(newValue, lastUpdate, OrdMap.empty);
    const notifyListeners = state.listeners.toList.traverse(
      this.F,
      ([, listener]) => listener.complete([newValue, lastUpdate]),
    );

    return [newState, this.F.map_(notifyListeners, () => result)];
  };

  public modify<B>(f: (a: A) => [A, B]): Kind<F, [B]> {
    return this.F.flatten(this.state.modify(s => this.updateAndNotify(s, f)));
  }
}

type Props<F, A> = {
  readonly value: A;
  readonly lastUpdate: number;
  readonly listeners: OrdMap<number, Deferred<F, [A, number]>>;
};
class State<F, A> {
  public constructor(
    public readonly value: A,
    public readonly lastUpdate: number,
    public readonly listeners: OrdMap<number, Deferred<F, [A, number]>>,
  ) {}

  public copy = ({
    value = this.value,
    lastUpdate = this.lastUpdate,
    listeners = this.listeners,
  }: Partial<Props<F, A>> = {}): State<F, A> =>
    new State(value, lastUpdate, listeners);
}
