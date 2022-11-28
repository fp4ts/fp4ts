// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, Kind, TyK, TyVar } from '@fp4ts/core';
import { Functor, Monad } from '@fp4ts/cats';
import { ReaderF } from '@fp4ts/fused-core';
import { Algebra, Carrier, Eff, Handler } from '@fp4ts/fused-kernel';

/**
 * A carrier for the `Reader` effect.
 */
export type ReaderC<R, F, A> = (r: R) => Kind<F, [A]>;
export const ReaderC = Object.freeze({
  Monad: <R, F>(F: Monad<F>): Monad<$<ReaderCF, [R, F]>> => readerCMonad(F),

  Algebra: <R, Sig, F>(
    F: Algebra<Sig, F>,
  ): Algebra<{ reader: $<ReaderF, [R]> } | Sig, $<ReaderCF, [R, F]>> =>
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

  monad<F>(F: Monad<F>): Monad<$<ReaderCF, [R, F]>> {
    return ReaderC.Monad<R, F>(F);
  }

  eff<H, G, F, Sig, A>(
    F: Algebra<Sig, F>,
    H: Functor<H>,
    hdl: Handler<H, G, $<ReaderCF, [R, F]>>,
    { eff }: Eff<Record<N, $<ReaderF, [R]>>, G, A>,
    hu: Kind<H, [void]>,
  ): ReaderC<R, F, Kind<H, [A]>> {
    return r =>
      eff.foldMap<[F, H]>(
        () => F.pure(H.map_(hu, () => r)),
        (ga, f) => hdl(H.map_(hu, () => ga))(f(r)),
      );
  }

  other<H, G, F, Sig, A>(
    F: Algebra<Sig, F>,
    H: Functor<H>,
    hdl: Handler<H, G, $<ReaderCF, [R, F]>>,
    eff: Eff<Sig, G, A>,
    hu: Kind<H, [void]>,
  ): ReaderC<R, F, Kind<H, [A]>> {
    return r => F.eff(H, hx => hdl(hx)(r), eff, hu);
  }
}

const readerCMonad = <R, F>(F: Monad<F>): Monad<$<ReaderCF, [R, F]>> =>
  Monad.of<$<ReaderCF, [R, F]>>({
    pure: a => _ => F.pure(a),
    map_: (fa, f) => r => F.map_(fa(r), f),
    flatMap_: (fa, f) => r => F.flatMap_(fa(r), x => f(x)(r)),
    tailRecM_: (a, f) => r => F.tailRecM_(a, x => f(x)(r)),
  });

// -- HKT

export interface ReaderCF extends TyK<[unknown, unknown, unknown]> {
  [$type]: ReaderC<TyVar<this, 0>, TyVar<this, 1>, TyVar<this, 2>>;
}
export interface ReaderCF1<R> extends TyK<[unknown]> {
  [$type]: $<ReaderCF, [R, TyVar<this, 0>]>;
}
