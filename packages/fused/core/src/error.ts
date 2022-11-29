// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, Kind, TyK, TyVar } from '@fp4ts/core';
import { MonadError } from '@fp4ts/cats';
import { Algebra } from '@fp4ts/fused-kernel';

/**
 * The `Error` effect.
 *
 * Adds a recoverable error channel to the effect similar to `MonadError`.
 */
export type Error<E, F, A> = _Error<E, F, A>;
export const Error = Object.freeze({
  MonadError: <E, F>(
    F: Algebra<{ error: $<ErrorF, [E]> }, F>,
  ): MonadError<F, E> =>
    MonadError.of({
      ...F,
      throwError: <A>(e: E) => F.send('error')(new Throw<E, F, A>(e)),
      handleErrorWith_: (fa, h) => F.send('error')(new HandleErrorWith(fa, h)),
    }),
});

abstract class _Error<E, F, A> {
  private readonly _E!: () => E;
  private readonly _F!: <X>(fx: Kind<F, [X]>) => Kind<F, [X]>;
  private readonly _A!: () => A;

  public abstract foldMap<G>(
    onThrow: <A>(e: E) => Kind<G, [A]>,
    onHandleErrorWith: <A>(
      fa: Kind<F, [A]>,
      h: (e: E) => Kind<F, [A]>,
    ) => Kind<G, [A]>,
  ): Kind<G, [A]>;
}

export class Throw<E, F, A> extends _Error<E, F, A> {
  public constructor(public readonly error: E) {
    super();
  }

  public foldMap<G>(
    onThrow: <A>(e: E) => Kind<G, [A]>,
    onHandleErrorWith: <A>(
      fa: Kind<F, [A]>,
      h: (e: E) => Kind<F, [A]>,
    ) => Kind<G, [A]>,
  ): Kind<G, [A]> {
    return onThrow(this.error);
  }
}
export class HandleErrorWith<E, F, A> extends _Error<E, F, A> {
  public constructor(
    public readonly self: Kind<F, [A]>,
    public readonly h: (e: E) => Kind<F, [A]>,
  ) {
    super();
  }

  public foldMap<G>(
    onThrow: <A>(e: E) => Kind<G, [A]>,
    onHandleErrorWith: <A>(
      fa: Kind<F, [A]>,
      h: (e: E) => Kind<F, [A]>,
    ) => Kind<G, [A]>,
  ): Kind<G, [A]> {
    return onHandleErrorWith(this.self, this.h);
  }
}

// -- HKT

export interface ErrorF extends TyK<[unknown, unknown, unknown]> {
  [$type]: Error<TyVar<this, 0>, TyVar<this, 1>, TyVar<this, 2>>;
}
