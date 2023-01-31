// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, cached, Kind, pipe, tupled, TyK, TyVar } from '@fp4ts/core';
import { Bifunctor, Functor, Monad, Monoid } from '@fp4ts/cats';
import { WriterT, WriterTF } from '@fp4ts/cats-mtl';
import { Algebra, Carrier, Eff, Handler } from '@fp4ts/fused-kernel';
import { WriterF } from '@fp4ts/fused-core';

/**
 * A `WriterT` carrier for the `Writer` effect.
 */
export function WriterTAlgebra<W, Sig, F>(
  F: Algebra<Sig, F>,
  W: Monoid<W>,
): Algebra<{ writer: $<WriterF, [W]> } | Sig, $<WriterCF, [F, W]>> {
  return Algebra.withCarrier<$<WriterF, [W]>, WriterCF1<W>, 'writer'>(
    new WriterCarrier('writer', W),
  )(F);
}

// -- Instances

class WriterCarrier<W, N extends string> extends Carrier<
  $<WriterF, [W]>,
  WriterCF1<W>,
  N
> {
  public constructor(public readonly tag: N, private readonly W: Monoid<W>) {
    super();
  }

  monad<F>(F: Monad<F>): Monad<$<WriterCF, [F, W]>> {
    return WriterT.Monad(F, this.W);
  }

  eff<H, G, F, Sig, A>(
    F: Algebra<Sig, F>,
    H: Functor<H>,
    hdl: Handler<H, G, $<WriterCF, [F, W]>>,
    { eff }: Eff<Record<N, $<WriterF, [W]>>, G, A>,
    hu: Kind<H, [void]>,
  ): WriterT<F, W, Kind<H, [A]>> {
    return eff.foldMap<[$<WriterCF, [F, W]>, H]>(
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
    hdl: Handler<H, G, $<WriterCF, [F, W]>>,
    eff: Eff<Sig, G, A>,
    hu: Kind<H, [void]>,
  ): WriterT<F, W, Kind<H, [A]>> {
    return F.eff(
      this.buildCtxFunctor(H),
      ([hx, w1]) =>
        F.map_(hdl(hx), ([ha, w2]) => tupled(ha, this.W.combine_(w1, w2))),
      eff,
      [hu, this.W.empty],
    );
  }

  private buildCtxFunctor = cached(<H>(H: Functor<H>) =>
    Functor.compose(Bifunctor.Tuple2.leftFunctor<W>(), H),
  );
}

// -- HKT

export type WriterCF = WriterTF;
export interface WriterCF1<W> extends TyK<[unknown]> {
  [$type]: $<WriterCF, [TyVar<this, 0>, W]>;
}
