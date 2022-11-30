// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Kind } from '@fp4ts/core';
import { Functor, Semigroup } from '@fp4ts/cats';
import { IxRWSF, RWS } from '@fp4ts/cats-mtl';
import { Algebra, Eff, Handler } from '@fp4ts/fused-kernel';
import { WriterF } from '@fp4ts/fused-core';

/**
 * A RWS carrier for the `State` effect.
 */
export function RWSAlgebra<R, W, S>(
  W: Semigroup<W>,
): Algebra<{ writer: $<WriterF, [W]> }, $<IxRWSF, [R, W, S, S]>>;
export function RWSAlgebra<R, W, S, Sig>(
  W: Semigroup<W>,
  F: Algebra<Sig, $<IxRWSF, [R, W, S, S]>>,
): Algebra<{ writer: $<WriterF, [W]> } | Sig, $<IxRWSF, [R, W, S, S]>>;
export function RWSAlgebra<R, W, S, Sig>(
  W: Semigroup<W>,
  F?: Algebra<Sig, $<IxRWSF, [R, W, S, S]>>,
): Algebra<{ writer: $<WriterF, [W]> } | Sig, $<IxRWSF, [R, W, S, S]>> {
  return Algebra.of<{ writer: $<WriterF, [W]> } | Sig, $<IxRWSF, [R, W, S, S]>>(
    {
      ...RWS.Monad<R, W, S>()!,

      eff: (<H, G, A>(
        H: Functor<H>,
        hdl: Handler<H, G, $<IxRWSF, [R, W, S, S]>>,
        eff: Eff<{ writer: $<WriterF, [W]> } | Sig, G, A>,
        hu: Kind<H, [void]>,
      ): RWS<R, W, S, Kind<H, [A]>> =>
        eff.tag === 'writer'
          ? (eff as Eff<{ writer: $<WriterF, [W]> }, G, A>).eff.foldMap<
              [$<IxRWSF, [R, W, S, S]>, H]
            >(
              w => RWS.tell<W, S>(w).map(() => hu),
              ga =>
                hdl(H.map_(hu, () => ga))
                  .listen()
                  .map(([ha, w]) => H.map_(ha, a => [a, w])),
              (ga, f) => hdl(H.map_(hu, () => ga)).censor(f, W),
            )
          : F!.eff(H, hdl, eff as Eff<Sig, G, A>, hu)) as Algebra<
        { writer: $<WriterF, [W]> } | Sig,
        $<IxRWSF, [R, W, S, S]>
      >['eff'],
    },
  );
}
