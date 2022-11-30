// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Kind } from '@fp4ts/core';
import { Functor } from '@fp4ts/cats';
import { IxRWSF, RWS } from '@fp4ts/cats-mtl';
import { Algebra, Eff, Handler } from '@fp4ts/fused-kernel';
import { ReaderF } from '@fp4ts/fused-core';

/**
 * A RWS carrier for the `Reader` effect.
 */
export function RWSAlgebra<R, W, S>(): Algebra<
  { reader: $<ReaderF, [R]> },
  $<IxRWSF, [R, W, S, S]>
>;
export function RWSAlgebra<R, W, S, Sig>(
  F: Algebra<Sig, $<IxRWSF, [R, W, S, S]>>,
): Algebra<{ reader: $<ReaderF, [R]> } | Sig, $<IxRWSF, [R, W, S, S]>>;
export function RWSAlgebra<R, W, S, Sig>(
  F?: Algebra<Sig, $<IxRWSF, [R, W, S, S]>>,
): Algebra<{ reader: $<ReaderF, [R]> } | Sig, $<IxRWSF, [R, W, S, S]>> {
  return Algebra.of<{ reader: $<ReaderF, [R]> } | Sig, $<IxRWSF, [R, W, S, S]>>(
    {
      ...RWS.Monad<R, W, S>()!,

      eff: (<H, G, A>(
        H: Functor<H>,
        hdl: Handler<H, G, $<IxRWSF, [R, W, S, S]>>,
        eff: Eff<{ reader: $<ReaderF, [R]> } | Sig, G, A>,
        hu: Kind<H, [void]>,
      ): RWS<R, W, S, Kind<H, [A]>> =>
        eff.tag === 'reader'
          ? (eff as Eff<{ reader: $<ReaderF, [R]> }, G, A>).eff.foldMap<
              [$<IxRWSF, [R, W, S, S]>, H]
            >(
              () => RWS.ask<R, S>().map(r => H.map_(hu, () => r)),
              (ga, f) => hdl(H.map_(hu, () => ga)).local(f),
            )
          : F!.eff(H, hdl, eff as Eff<Sig, G, A>, hu)) as Algebra<
        { reader: $<ReaderF, [R]> } | Sig,
        $<IxRWSF, [R, W, S, S]>
      >['eff'],
    },
  );
}
