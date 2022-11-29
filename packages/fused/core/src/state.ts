// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, compose, Kind, TyK, TyVar } from '@fp4ts/core';
import { MonadState } from '@fp4ts/cats-mtl';
import { Algebra } from '@fp4ts/fused-kernel';

/**
 * The `State` effect.
 *
 * Adds mutable state value to the given computation.
 */
export type State<S, F, A> = _State<S, F, A>;
export const State = Object.freeze({
  Syntax: <S, F>(
    F: Algebra<{ state: $<StateF, [S]> }, F>,
  ): StateSyntax<S, F> => {
    const self: StateSyntax<S, F> = {
      set: s => F.send('state')(new Set(s)),
      get: F.send('state')(new Get()),

      state: runState =>
        F.flatMap_(self.get, s => {
          const [a, s2] = runState(s);
          return F.map_(self.set(s2), _ => a);
        }),

      modify: f => F.flatMap_(self.get, compose(self.set, f)),
    };
    return self;
  },

  MonadState: <S, F>(
    F: Algebra<{ state: $<StateF, [S]> }, F>,
  ): MonadState<F, S> =>
    MonadState.of({
      ...F,
      set: s => F.send('state')(new Set(s)),
      get: F.send('state')(new Get()),
    }),
});

interface StateSyntax<S, F> {
  readonly get: Kind<F, [S]>;
  set(s: S): Kind<F, [void]>;
  state<A>(f: (s: S) => [A, S]): Kind<F, [A]>;
  modify(f: (s: S) => S): Kind<F, [void]>;
}

abstract class _State<S, F, out A> {
  private readonly _S!: (s: S) => S;
  private readonly _F!: <X>(fx: Kind<F, [X]>) => Kind<F, [X]>;
  private readonly _A!: () => A;

  public abstract foldMap<G>(
    onGet: () => Kind<G, [S]>,
    onSet: (s: S) => Kind<G, [void]>,
  ): Kind<G, [A]>;
}

export class Get<S, F> extends _State<S, F, S> {
  public foldMap<G>(
    onGet: () => Kind<G, [S]>,
    onSet: (s: S) => Kind<G, [void]>,
  ): Kind<G, [S]> {
    return onGet();
  }
}
export class Set<S, F> extends _State<S, F, void> {
  public constructor(public readonly state: S) {
    super();
  }

  public foldMap<G>(
    onGet: () => Kind<G, [S]>,
    onSet: (s: S) => Kind<G, [void]>,
  ): Kind<G, [void]> {
    return onSet(this.state);
  }
}

// -- HKT

export interface StateF extends TyK<[unknown, unknown, unknown]> {
  [$type]: State<TyVar<this, 0>, TyVar<this, 1>, TyVar<this, 2>>;
}
