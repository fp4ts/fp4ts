// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, pipe, snd } from '@fp4ts/core';
import { OrderedMap, List } from '@fp4ts/cats';
import { Fiber, Concurrent, Resource, UniqueToken } from '@fp4ts/effect-kernel';

export interface Supervisor<F> {
  supervise<A>(fa: Kind<F, [A]>): Kind<F, [Fiber<F, Error, A>]>;
}

export function Supervisor<F>(
  F: Concurrent<F, Error>,
): Resource<F, Supervisor<F>> {
  const stateRefR = Resource.make(F)(
    F.ref<OrderedMap<UniqueToken, Kind<F, [void]>>>(OrderedMap.empty),
    state =>
      pipe(
        state.get(),
        F.flatMap(fibers =>
          F.parSequence(List.Traversable)(fibers.toList.map(snd)),
        ),
        F.void,
      ),
  );

  return stateRefR.map(state => ({
    supervise: <A>(fa: Kind<F, [A]>): Kind<F, [Fiber<F, Error, A>]> =>
      F.uncancelable(() =>
        pipe(
          F.Do,
          F.bindTo('done', F.ref<boolean>(false)),
          F.bindTo('token', F.unique),
          F.bindTo('cleanup', ({ token }) =>
            F.pure(state.update(s => s.remove(UniqueToken.Ord, token))),
          ),
          F.bindTo('action', ({ done, cleanup }) =>
            F.pure(F.finalize_(fa, () => F.productR_(done.set(true), cleanup))),
          ),
          F.bindTo('fiber', ({ action }) => F.fork(action)),
          F.bind(({ token, fiber }) =>
            state.update(m => m.insert(UniqueToken.Ord, token, fiber.cancel)),
          ),
          F.bind(({ done, cleanup }) =>
            F.flatMap_(done.get(), done => (done ? cleanup : F.unit)),
          ),
          F.map(({ fiber }) => fiber),
        ),
      ),
  }));
}
