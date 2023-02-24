// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, Kind, TyK, TyVar } from '@fp4ts/core';
import { MonadReader } from '@fp4ts/mtl';
import { Algebra } from '@fp4ts/fused-kernel';

/**
 * The `Reader` effect.
 *
 * Adds access to additional, locally modifiable context.
 */
export type Reader<R, F, A> = _Reader<R, F, A>;
export const Reader = Object.freeze({
  Syntax: <R, F>(
    F: Algebra<{ reader: $<ReaderF, [R]> }, F>,
  ): ReaderSyntax<R, F> => {
    const self: ReaderSyntax<R, F> = {
      ask: F.send('reader')(new Ask()),
      local: f => fa => self.local_(fa, f),
      local_: (fa, f) => F.send('reader')(new Local(fa, f)),
    };
    return self;
  },

  MonadReader: <R, F>(
    F: Algebra<{ reader: $<ReaderF, [R]> }, F>,
  ): MonadReader<F, R> =>
    MonadReader.of({
      ...F,
      ask: () => F.send('reader')(new Ask()),
      local_: (fa, f) => F.send('reader')(new Local(fa, f)),
    }),
});

interface ReaderSyntax<R, F> {
  readonly ask: Kind<F, [R]>;
  local(f: (r: R) => R): <A>(fa: Kind<F, [A]>) => Kind<F, [A]>;
  local_<A>(fa: Kind<F, [A]>, f: (r: R) => R): Kind<F, [A]>;
}

abstract class _Reader<R, F, out A> {
  private readonly _R!: (r: R) => void;
  private readonly _F!: <X>(fx: Kind<F, [X]>) => Kind<F, [X]>;
  private readonly _A!: () => A;

  public abstract foldMap<G>(
    onAsk: () => Kind<G, [R]>,
    onLocal: <A>(fa: Kind<F, [A]>, f: (r: R) => R) => Kind<G, [A]>,
  ): Kind<G, [A]>;
}

export class Ask<R, F> extends _Reader<R, F, R> {
  readonly tag = 'ask';

  public foldMap<G>(
    onAsk: () => Kind<G, [R]>,
    onLocal: <A>(fa: Kind<F, [A]>, f: (r: R) => R) => Kind<G, [A]>,
  ): Kind<G, [R]> {
    return onAsk();
  }
}
export class Local<R, F, A> extends _Reader<R, F, A> {
  readonly tag = 'local';
  public constructor(
    public readonly self: Kind<F, [A]>,
    public readonly f: (r: R) => R,
  ) {
    super();
  }

  public foldMap<G>(
    onAsk: () => Kind<G, [R]>,
    onLocal: <A>(fa: Kind<F, [A]>, f: (r: R) => R) => Kind<G, [A]>,
  ): Kind<G, [A]> {
    return onLocal(this.self, this.f);
  }
}

// -- HKT

export interface ReaderF extends TyK<[unknown, unknown, unknown]> {
  [$type]: Reader<TyVar<this, 0>, TyVar<this, 1>, TyVar<this, 2>>;
}
