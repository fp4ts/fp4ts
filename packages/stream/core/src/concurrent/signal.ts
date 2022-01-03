// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, pipe } from '@fp4ts/core';
import { OrderedMap } from '@fp4ts/cats';
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
    pipe(
      F.Do,
      F.bindTo('state', F.ref(new State<F, A>(initial, 0, OrderedMap.empty))),
      F.bindTo('ids', F.ref(0)),
      F.map(({ state, ids }) => {
        const newId = ids.updateAndGet(x => x + 1);

        const updateAndNotify = <B>(
          state: State<F, A>,
          f: (a: A) => [A, B],
        ): [State<F, A>, Kind<F, [B]>] => {
          const [newValue, result] = f(state.value);
          const lastUpdate = state.lastUpdate + 1;
          const newState = new State<F, A>(
            newValue,
            lastUpdate,
            OrderedMap.empty,
          );
          const notifyListeners = state.listeners.toList.traverse(F)(
            ([, listener]) => listener.complete([newValue, lastUpdate]),
          );

          return [newState, F.map_(notifyListeners, () => result)];
        };

        const get: Kind<F, [A]> = F.map_(state.get(), s => s.value);

        const continuous = (): Stream<F, A> => Stream.repeatEval(get);

        const discrete = (): Stream<F, A> => {
          const go = (id: number, lastSeen: number): Stream<F, A> => {
            const getNext: Kind<F, [[A, number]]> = pipe(
              F.deferred<[A, number]>(),
              F.flatMap(wait =>
                state.modify(s =>
                  s.lastUpdate !== lastSeen
                    ? [s, F.pure([s.value, s.lastUpdate])]
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
            state.update(s => s.copy({ listeners: s.listeners.remove(id) }));

          return Stream.bracket(newId, cleanup).flatMap(id =>
            Stream.evalF(state.get()).flatMap(state =>
              Stream.pure<F, A>(state.value)['+++'](go(id, state.lastUpdate)),
            ),
          );
        };

        return new (class SignallingRef
          extends Ref<F, A>
          implements Signal<F, A>
        {
          public constructor() {
            super();
          }

          public discrete = discrete;
          public continuous = continuous;

          public get(): Kind<F, [A]> {
            return get;
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

          public modify<B>(f: (a: A) => [A, B]): Kind<F, [B]> {
            return F.flatten(state.modify(s => updateAndNotify(s, f)));
          }
        })();
      }),
    );
};

type Props<F, A> = {
  readonly value: A;
  readonly lastUpdate: number;
  readonly listeners: OrderedMap<number, Deferred<F, [A, number]>>;
};
class State<F, A> {
  public constructor(
    public readonly value: A,
    public readonly lastUpdate: number,
    public readonly listeners: OrderedMap<number, Deferred<F, [A, number]>>,
  ) {}

  public copy = ({
    value = this.value,
    lastUpdate = this.lastUpdate,
    listeners = this.listeners,
  }: Partial<Props<F, A>> = {}): State<F, A> =>
    new State(value, lastUpdate, listeners);
}
