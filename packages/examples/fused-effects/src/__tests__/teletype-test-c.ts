// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Kind, pipe } from '@fp4ts/core';
import { Functor } from '@fp4ts/cats';
import {
  Algebra,
  Eff,
  Handler,
  State,
  StateF,
  Writer,
  WriterF,
} from '@fp4ts/fused';
import { StateC, WriterCF } from '@fp4ts/fused-std';
import { TeletypeF } from '../teletype';

export type TeletypeTestC<F, A> = StateC<
  string[],
  $<WriterCF, [string[], F]>,
  A
>;

type Sig = { teletype: TeletypeF } | TeletypeTestIOC;
type TeletypeTestIOC =
  | { state: $<StateF, [string[]]> }
  | { writer: $<WriterF, [string[]]> };
export const TeletypeTestC = Object.freeze({
  Algebra: <F>(F: Algebra<TeletypeTestIOC, F>): Algebra<Sig, F> => {
    const S = State.Syntax(F);
    const W = Writer.Syntax(F);

    return Algebra.of<Sig, F>({
      ...F,
      eff: (<H, G, A>(
        H: Functor<H>,
        hdl: Handler<H, G, F>,
        eff: Eff<Sig, G, A>,
        hu: Kind<H, [void]>,
      ): Kind<F, [Kind<H, [A]>]> =>
        eff.tag === 'teletype'
          ? eff.eff.fold(
              () =>
                pipe(
                  S.state(([line, ...lines]) => [line, lines]),
                  F.map(line => H.map_(hu, () => line as any as A)),
                ),
              line =>
                pipe(
                  W.tell([line]),
                  F.map(() => hu as any as Kind<H, [A]>),
                ),
            )
          : F.eff(H, hdl, eff as any, hu)) as Algebra<Sig, F>['eff'],
    });
  },
});
