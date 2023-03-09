// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, pipe, snd } from '@fp4ts/core';
import { OrdMap, List } from '@fp4ts/collections';
import {
  Fiber,
  Concurrent,
  Resource,
  UniqueToken,
  Ref,
} from '@fp4ts/effect-kernel';

export interface Supervisor<F> {
  supervise<A>(fa: Kind<F, [A]>): Kind<F, [Fiber<F, Error, A>]>;
}

export function Supervisor<F>(
  F: Concurrent<F, Error>,
): Resource<F, Supervisor<F>> {
  const stateRefR = Resource.make(F)(
    F.ref<OrdMap<UniqueToken, Kind<F, [void]>>>(OrdMap.empty),
    state =>
      pipe(
        state.get(),
        F.flatMap(fibers =>
          F.parSequence(List.TraversableFilter)(fibers.toList.map(snd)),
        ),
        F.void,
      ),
  );

  return stateRefR.map(state => new SupervisorImpl(F, state));
}

class SupervisorImpl<F> implements Supervisor<F> {
  public constructor(
    private readonly F: Concurrent<F, Error>,
    private readonly state: Ref<F, OrdMap<UniqueToken, Kind<F, [void]>>>,
  ) {}

  public supervise<A>(fa: Kind<F, [A]>): Kind<F, [Fiber<F, Error, A>]> {
    const { F, state } = this;
    return F.uncancelable(() =>
      F.do(function* (_) {
        const done = yield* _(F.ref<boolean>(false));
        const token = yield* _(F.unique);

        const cleanup = state.update(s => s.remove(token, UniqueToken.Ord));
        const action = F.finalize_(fa, () =>
          F.productR_(done.set(true), cleanup),
        );

        const fiber = yield* _(F.fork(action));
        yield* _(
          state.update(m => m.insert(token, fiber.cancel, UniqueToken.Ord)),
        );
        yield* _(F.flatMap_(done.get(), done => (done ? cleanup : F.unit)));
        return fiber;
      }),
    );
  }
}
