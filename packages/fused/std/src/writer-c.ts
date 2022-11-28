// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, cached, Kind, pipe, tupled, TyK, TyVar } from '@fp4ts/core';
import { Functor, Left, Monad, Monoid, Right, Tuple2 } from '@fp4ts/cats';
import { Algebra, Carrier, Eff, Handler } from '@fp4ts/fused-kernel';
import { WriterF } from '@fp4ts/fused-core';

/**
 * A carrier for the `Writer` effect.
 */
export type WriterC<W, F, A> = Kind<F, [[A, W]]>;
export const WriterC = Object.freeze({
  Monad: <W, F>(F: Monad<F>, W: Monoid<W>) => writerCMonad(F, W),

  Algebra: <W, Sig, F>(
    F: Algebra<Sig, F>,
    W: Monoid<W>,
  ): Algebra<{ writer: $<WriterF, [W]> } | Sig, $<WriterCF, [W, F]>> =>
    Algebra.withCarrier<$<WriterF, [W]>, WriterCF1<W>, 'writer'>(
      new WriterCarrier('writer', W),
    )(F),
});

// -- Instances

class WriterCarrier<W, N extends string> extends Carrier<
  $<WriterF, [W]>,
  WriterCF1<W>,
  N
> {
  public constructor(public readonly tag: N, private readonly W: Monoid<W>) {
    super();
  }

  monad<F>(F: Monad<F>): Monad<$<WriterCF, [W, F]>> {
    return WriterC.Monad(F, this.W);
  }

  eff<H, G, F, Sig, A>(
    F: Algebra<Sig, F>,
    H: Functor<H>,
    hdl: Handler<H, G, $<WriterCF, [W, F]>>,
    { eff }: Eff<Record<N, $<WriterF, [W]>>, G, A>,
    hu: Kind<H, [void]>,
  ): WriterC<W, F, Kind<H, [A]>> {
    return eff.foldMap<[$<WriterCF, [W, F]>, H]>(
      w => F.pure([hu, w]),
      ga =>
        pipe(
          hdl(H.map_(hu, () => ga)),
          F.map(([h, w]) => [H.map_(h, a => [a, w]), w]),
        ),
      (ga, f) => F.map_(hdl(H.map_(hu, _ => ga)), ([ha, w]) => [ha, f(w)]),
    );
  }

  other<H, G, F, Sig, A>(
    F: Algebra<Sig, F>,
    H: Functor<H>,
    hdl: Handler<H, G, $<WriterCF, [W, F]>>,
    eff: Eff<Sig, G, A>,
    hu: Kind<H, [void]>,
  ): WriterC<W, F, Kind<H, [A]>> {
    return F.eff(
      this.buildCtxFunctor(H),
      ([hx, w1]) =>
        F.map_(hdl(hx), ([ha, w2]) =>
          tupled(
            ha,
            this.W.combine_(w1, () => w2),
          ),
        ),
      eff,
      [hu, this.W.empty],
    );
  }

  private buildCtxFunctor = cached(<H>(H: Functor<H>) =>
    Functor.compose(Tuple2.Bifunctor.leftFunctor<W>(), H),
  );
}

const writerCMonad = <W, F>(
  F: Monad<F>,
  W: Monoid<W>,
): Monad<$<WriterCF, [W, F]>> =>
  Monad.of<$<WriterCF, [W, F]>>({
    pure: a => F.pure([a, W.empty]),
    flatMap_: (fa, f) =>
      F.flatMap_(fa, ([a, w1]) =>
        F.map_(f(a), ([b, w2]) => [b, W.combine_(w1, () => w2)]),
      ),
    tailRecM_: (a, f) =>
      F.tailRecM_(tupled(a, W.empty), ([a, w1]) =>
        F.map_(f(a), ([ea, w2]) =>
          ea.fold(
            a =>
              Left(
                tupled(
                  a,
                  W.combine_(w1, () => w2),
                ),
              ),
            b => Right([b, W.combine_(w1, () => w2)]),
          ),
        ),
      ),
  });

// -- HKT

export interface WriterCF extends TyK<[unknown, unknown, unknown]> {
  [$type]: WriterC<TyVar<this, 0>, TyVar<this, 1>, TyVar<this, 2>>;
}
export interface WriterCF1<W> extends TyK<[unknown]> {
  [$type]: $<WriterCF, [W, TyVar<this, 0>]>;
}
