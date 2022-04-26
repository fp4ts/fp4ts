// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, instance, Kind, pipe } from '@fp4ts/core';
import { Monad, MonadRequirements } from '@fp4ts/cats-core';
import { XPure, XPureF } from '@fp4ts/cats-core/lib/data';

export interface MonadState<F, S> extends Monad<F> {
  get: Kind<F, [S]>;
  set(s: S): Kind<F, [void]>;

  modify(f: (s: S) => S): Kind<F, [void]>;
  inspect<A>(f: (s: S) => A): Kind<F, [A]>;
}

export type MonadStateRequirements<F, S> = Pick<
  MonadState<F, S>,
  'get' | 'set'
> &
  MonadRequirements<F> &
  Partial<MonadState<F, S>>;
export const MonadState = Object.freeze({
  of: <F, S>(F: MonadStateRequirements<F, S>): MonadState<F, S> => {
    const self: MonadState<F, S> = instance<MonadState<F, S>>({
      modify: f => pipe(self.get, self.map(f), self.flatMap(self.set)),
      inspect: f => pipe(self.get, self.map(f)),

      ...Monad.of(F),
      ...F,
    });
    return self;
  },

  XPure: <W, S, R, E>(): MonadState<$<XPureF, [W, S, S, R, E]>, S> =>
    MonadState.of({
      get: XPure.modify(s => [s, s]),
      set: s => XPure.modify(() => [s, undefined]),
      modify: f => XPure.modify(s => [f(s), undefined]),
      inspect: f => XPure.modify(s => [s, f(s)]),
      ...XPure.Monad<W, S, R, E>(),
    }),
});
