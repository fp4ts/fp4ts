// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, Kind, TyK, TyVar } from '@fp4ts/core';
import { Monoid } from '@fp4ts/cats';
import { MonadWriter } from '@fp4ts/cats-mtl';
import { Algebra } from '@fp4ts/fused-kernel';

/**
 * The `Writer` effect.
 *
 * Allows writes to accumulated value alongside the usual computation.
 */
export type Writer<W, F, A> = _Writer<W, F, A>;
export const Writer = Object.freeze({
  Syntax: <W, F>(
    F: Algebra<{ writer: $<WriterF, [W]> }, F>,
  ): WriterSyntax<W, F> => {
    const self: WriterSyntax<W, F> = {
      tell: w => F.send('writer')(new Tell(w)),
      listen: fa => F.send('writer')(new Listen(fa)),
      censor: f => fa => self.censor_(fa, f),
      censor_: (fa, f) => F.send('writer')(new Censor(fa, f)),
    };
    return self;
  },

  MonadWriter: <W, F>(
    F: Algebra<{ writer: $<WriterF, [W]> }, F>,
    W: Monoid<W>,
  ): MonadWriter<F, W> =>
    MonadWriter.of({
      ...F,
      monoid: W,
      tell: w => F.send('writer')(new Tell(w)),
      listen: fa => F.send('writer')(new Listen(fa)),
      censor_: (fa, f) => F.send('writer')(new Censor(fa, f)),
    }),
});

interface WriterSyntax<W, F> {
  tell(w: W): Kind<F, [void]>;
  listen<A>(fa: Kind<F, [A]>): Kind<F, [[A, W]]>;
  censor(f: (w: W) => W): <A>(fa: Kind<F, [A]>) => Kind<F, [A]>;
  censor_<A>(fa: Kind<F, [A]>, f: (w: W) => W): Kind<F, [A]>;
}

abstract class _Writer<W, F, A> {
  private readonly _W!: () => W;
  private readonly _F!: <X>(fx: Kind<F, [X]>) => Kind<F, [X]>;
  private readonly _A!: () => A;

  public abstract foldMap<G>(
    onTell: (w: W) => Kind<G, [void]>,
    onListen: <A>(fa: Kind<F, [A]>) => Kind<G, [[A, W]]>,
    onCensor: (fa: Kind<F, [A]>, f: (w: W) => W) => Kind<G, [A]>,
  ): Kind<G, [A]>;
}

export class Tell<W, F> extends _Writer<W, F, void> {
  readonly tag = 'tell';
  public constructor(public readonly w: W) {
    super();
  }

  public foldMap<G>(
    onTell: (w: W) => Kind<G, [void]>,
    onListen: <A>(fa: Kind<F, [A]>) => Kind<G, [[A, W]]>,
    onCensor: (fa: Kind<F, [void]>, f: (w: W) => W) => Kind<G, [void]>,
  ): Kind<G, [void]> {
    return onTell(this.w);
  }
}

export class Listen<W, F, A> extends _Writer<W, F, [A, W]> {
  readonly tag = 'listen';
  public constructor(public readonly self: Kind<F, [A]>) {
    super();
  }

  public foldMap<G>(
    onTell: (w: W) => Kind<G, [void]>,
    onListen: <A>(fa: Kind<F, [A]>) => Kind<G, [[A, W]]>,
    onCensor: (fa: Kind<F, [[A, W]]>, f: (w: W) => W) => Kind<G, [[A, W]]>,
  ): Kind<G, [[A, W]]> {
    return onListen(this.self);
  }
}

export class Censor<W, F, A> extends _Writer<W, F, A> {
  readonly tag = 'listen';
  public constructor(
    public readonly self: Kind<F, [A]>,
    public readonly f: (w: W) => W,
  ) {
    super();
  }

  public foldMap<G>(
    onTell: (w: W) => Kind<G, [void]>,
    onListen: <A>(fa: Kind<F, [A]>) => Kind<G, [[A, W]]>,
    onCensor: (fa: Kind<F, [A]>, f: (w: W) => W) => Kind<G, [A]>,
  ): Kind<G, [A]> {
    return onCensor(this.self, this.f);
  }
}

// -- HKT

export interface WriterF extends TyK<[unknown, unknown, unknown]> {
  [$type]: Writer<TyVar<this, 0>, TyVar<this, 1>, TyVar<this, 2>>;
}
