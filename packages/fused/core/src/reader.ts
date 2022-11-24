// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, Kind, TyK, TyVar } from '@fp4ts/core';
import { Algebra } from '@fp4ts/fused-kernel';

/**
 * The `Reader` effect.
 *
 * Adds access to additional, locally modifiable context.
 */
export type Reader<R, F, A> = Ask<R, F> | Local<R, F, A>;
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
});

interface ReaderSyntax<R, F> {
  readonly ask: Kind<F, [R]>;
  local(f: (r: R) => R): <A>(fa: Kind<F, [A]>) => Kind<F, [A]>;
  local_<A>(fa: Kind<F, [A]>, f: (r: R) => R): Kind<F, [A]>;
}

class _Reader<in R, F, out A> {
  private readonly _R!: (r: R) => void;
  private readonly _F!: <X>(fx: Kind<F, [X]>) => Kind<F, [X]>;
  private readonly _A!: () => A;
}

export class Ask<R, F> extends _Reader<R, F, R> {
  readonly tag = 'ask';
}
export class Local<R, F, A> extends _Reader<R, F, A> {
  readonly tag = 'local';
  public constructor(
    public readonly self: Kind<F, [A]>,
    public readonly f: (r: R) => R,
  ) {
    super();
  }
}

// -- HKT

export interface ReaderF extends TyK<[unknown, unknown, unknown]> {
  [$type]: Reader<TyVar<this, 0>, TyVar<this, 1>, TyVar<this, 2>>;
}
