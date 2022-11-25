// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, absurd, Kind } from '@fp4ts/core';
import { Functor } from '@fp4ts/cats';
import { RWS, IxRWSF } from '@fp4ts/cats-mtl';
import { ReaderF, StateF } from '@fp4ts/fused-core';
import { Algebra, Eff, Handler } from '@fp4ts/fused-kernel';

export const RWSAlgebra = <R, W, S>(): Algebra<
  { reader: $<ReaderF, [R]> } | { state: $<StateF, [S]> },
  $<IxRWSF, [R, W, S, S]>
> =>
  Algebra.of({
    eff: (<H, G, A>(
      H: Functor<H>,
      hdl: Handler<H, G, $<IxRWSF, [R, W, S, S]>>,
      eff: Eff<{ reader: $<ReaderF, [R]> } | { state: $<StateF, [S]> }, G, A>,
      hu: Kind<H, [void]>,
    ) => {
      switch (eff.tag) {
        case 'reader': {
          const re = eff.eff;
          return re.tag === 'ask'
            ? RWS.ask()
            : hdl(H.map_(hu, () => re.self)).local(re.f);
        }

        case 'state': {
          const se = eff.eff;
          return se.tag === 'get' ? RWS.get() : RWS.set(se.state);
        }

        default:
          return absurd(eff);
      }
    }) as Algebra<
      { reader: $<ReaderF, [R]> } | { state: $<StateF, [S]> },
      $<IxRWSF, [R, W, S, S]>
    >['eff'],

    ...RWS.Monad<R, W, S>(),
  });
