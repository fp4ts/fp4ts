// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, cached, Kind, tupled, TyK, TyVar } from '@fp4ts/core';
import { Functor, Monad, Monoid, Tuple2 } from '@fp4ts/cats';
import {
  WriterTChurch as WriterT,
  WriterTChurchF as WriterTF,
} from '@fp4ts/cats-mtl';
import { Algebra, Carrier, Eff, Handler } from '@fp4ts/fused-kernel';
import { WriterF } from '@fp4ts/fused-core';

/**
 * A church-encoded `WriterT` carrier for the `Writer` effect.
 */
export function ChurchAlgebra<W, Sig, F>(
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
    return WriterT.Monad(F);
  }

  eff<H, G, F, Sig, A>(
    F: Algebra<Sig, F>,
    H: Functor<H>,
    hdl: Handler<H, G, $<WriterCF, [F, W]>>,
    { eff }: Eff<Record<N, $<WriterF, [W]>>, G, A>,
    hu: Kind<H, [void]>,
  ): WriterT<F, W, Kind<H, [A]>> {
    return eff.foldMap<[$<WriterCF, [F, W]>, H]>(
      w => g => w1 => g(hu)(this.W.combine_(w1, () => w)),
      ga => g =>
        hdl(H.map_(hu, () => ga))(ha => w => g(H.map_(ha, a => [a, w]))(w)),
      (ga, f) => g => w => hdl(H.map_(hu, () => ga))(g)(f(w)),
    );
  }

  other<H, G, F, Sig, A>(
    F: Algebra<Sig, F>,
    H: Functor<H>,
    hdl: Handler<H, G, $<WriterCF, [F, W]>>,
    eff: Eff<Sig, G, A>,
    hu: Kind<H, [void]>,
  ): WriterT<F, W, Kind<H, [A]>> {
    return g => w =>
      F.flatMap_(
        F.eff(
          this.buildCtxFunctor(H),
          ([hx, w]) => hdl(hx)(x => w => F.pure(tupled(x, w)))(w),
          eff,
          [hu, w],
        ),
        ([ha, w]) => g(ha)(w),
      );
  }

  private buildCtxFunctor = cached(<H>(H: Functor<H>) =>
    Functor.compose(Tuple2.Bifunctor.leftFunctor<W>(), H),
  );
}

// -- HKT

export type WriterCF = WriterTF;
export interface WriterCF1<W> extends TyK<[unknown]> {
  [$type]: $<WriterCF, [TyVar<this, 0>, W]>;
}
