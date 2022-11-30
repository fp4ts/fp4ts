// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Kind } from '@fp4ts/core';
import { Applicative, Functor, Monoid } from '@fp4ts/cats';
import { IxRWSTF, RWST } from '@fp4ts/cats-mtl';
import { Algebra, Eff, Handler } from '@fp4ts/fused-kernel';
import { ReaderF } from '@fp4ts/fused-core';

/**
 * A RWS carrier for the `Reader` effect.
 */
export function RWSTAlgebra<R, W, S, Sig, F>(
  FA: Algebra<Sig, $<IxRWSTF, [R, W, S, S, F]>>,
  F: Applicative<F>,
  W: Monoid<W>,
): Algebra<{ reader: $<ReaderF, [R]> } | Sig, $<IxRWSTF, [R, W, S, S, F]>> {
  return Algebra.of<
    { reader: $<ReaderF, [R]> } | Sig,
    $<IxRWSTF, [R, W, S, S, F]>
  >({
    ...FA,

    eff: (<H, G, A>(
      H: Functor<H>,
      hdl: Handler<H, G, $<IxRWSTF, [R, W, S, S, F]>>,
      eff: Eff<{ reader: $<ReaderF, [R]> } | Sig, G, A>,
      hu: Kind<H, [void]>,
    ): RWST<R, W, S, F, Kind<H, [A]>> =>
      eff.tag === 'reader'
        ? (eff as Eff<{ reader: $<ReaderF, [R]> }, G, A>).eff.foldMap<
            [$<IxRWSTF, [R, W, S, S, F]>, H]
          >(
            () => (r, s) => F.pure([H.map_(hu, () => r), s, W.empty]),
            (ga, f) => RWST.local_(hdl(H.map_(hu, () => ga)), f),
          )
        : FA.eff(H, hdl, eff as Eff<Sig, G, A>, hu)) as Algebra<
      { reader: $<ReaderF, [R]> } | Sig,
      $<IxRWSTF, [R, W, S, S, F]>
    >['eff'],
  });
}
