// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Kind } from '@fp4ts/core';
import { Functor } from '@fp4ts/cats';
import { IxRWSF, RWS } from '@fp4ts/cats-mtl';
import { Algebra, Eff, Handler } from '@fp4ts/fused-kernel';
import { StateF } from '@fp4ts/fused-core';

/**
 * A RWS carrier for the `State` effect.
 */
export function RWSAlgebra<R, W, S>(): Algebra<
  { state: $<StateF, [S]> },
  $<IxRWSF, [R, W, S, S]>
>;
export function RWSAlgebra<R, W, S, Sig>(
  F: Algebra<Sig, $<IxRWSF, [R, W, S, S]>>,
): Algebra<{ state: $<StateF, [S]> } | Sig, $<IxRWSF, [R, W, S, S]>>;
export function RWSAlgebra<R, W, S, Sig>(
  F?: Algebra<Sig, $<IxRWSF, [R, W, S, S]>>,
): Algebra<{ state: $<StateF, [S]> } | Sig, $<IxRWSF, [R, W, S, S]>> {
  return Algebra.of<{ state: $<StateF, [S]> } | Sig, $<IxRWSF, [R, W, S, S]>>({
    ...RWS.Monad<R, W, S>()!,

    eff: (<H, G, A>(
      H: Functor<H>,
      hdl: Handler<H, G, $<IxRWSF, [R, W, S, S]>>,
      eff: Eff<{ state: $<StateF, [S]> } | Sig, G, A>,
      hu: Kind<H, [void]>,
    ): RWS<R, W, S, Kind<H, [A]>> =>
      eff.tag === 'state'
        ? (eff as Eff<{ state: $<StateF, [S]> }, G, A>).eff.foldMap<
            [$<IxRWSF, [R, W, S, S]>, H]
          >(
            () => RWS.get<S>().map(s => H.map_(hu, () => s)),
            s => RWS.set(s).map(() => hu),
          )
        : F!.eff(H, hdl, eff as Eff<Sig, G, A>, hu)) as Algebra<
      { state: $<StateF, [S]> } | Sig,
      $<IxRWSF, [R, W, S, S]>
    >['eff'],
  });
}
