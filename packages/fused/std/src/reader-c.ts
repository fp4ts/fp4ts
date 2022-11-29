// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, Kind, TyK, TyVar } from '@fp4ts/core';
import { Functor, Kleisli, KleisliF, Monad } from '@fp4ts/cats';
import { ReaderF } from '@fp4ts/fused-core';
import { Algebra, Carrier, Eff, Handler } from '@fp4ts/fused-kernel';

/**
 * A carrier for the `Reader` effect.
 */
export type ReaderC<F, R, A> = Kleisli<F, R, A>;
export const ReaderC = Object.freeze({
  Monad: <F, R>(F: Monad<F>): Monad<$<ReaderCF, [F, R]>> => Kleisli.Monad(F),

  Algebra: <R, Sig, F>(
    F: Algebra<Sig, F>,
  ): Algebra<{ reader: $<ReaderF, [R]> } | Sig, $<ReaderCF, [F, R]>> =>
    Algebra.withCarrier<$<ReaderF, [R]>, ReaderCF1<R>, 'reader'>(
      new ReaderCarrier('reader'),
    )(F),
});

// -- Instances

class ReaderCarrier<R, N extends string> extends Carrier<
  $<ReaderF, [R]>,
  ReaderCF1<R>,
  N
> {
  public constructor(public readonly tag: N) {
    super();
  }

  monad<F>(F: Monad<F>): Monad<$<ReaderCF, [F, R]>> {
    return ReaderC.Monad<F, R>(F);
  }

  eff<H, G, F, Sig, A>(
    F: Algebra<Sig, F>,
    H: Functor<H>,
    hdl: Handler<H, G, $<ReaderCF, [F, R]>>,
    { eff }: Eff<Record<N, $<ReaderF, [R]>>, G, A>,
    hu: Kind<H, [void]>,
  ): ReaderC<F, R, Kind<H, [A]>> {
    return r =>
      eff.foldMap<[F, H]>(
        () => F.pure(H.map_(hu, () => r)),
        (ga, f) => hdl(H.map_(hu, () => ga))(f(r)),
      );
  }

  other<H, G, F, Sig, A>(
    F: Algebra<Sig, F>,
    H: Functor<H>,
    hdl: Handler<H, G, $<ReaderCF, [F, R]>>,
    eff: Eff<Sig, G, A>,
    hu: Kind<H, [void]>,
  ): ReaderC<F, R, Kind<H, [A]>> {
    return r => F.eff(H, hx => hdl(hx)(r), eff, hu);
  }
}

// -- HKT

export type ReaderCF = KleisliF;
export interface ReaderCF1<R> extends TyK<[unknown]> {
  [$type]: $<ReaderCF, [TyVar<this, 0>, R]>;
}
