// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, cached, Kind, TyK, TyVar } from '@fp4ts/core';
import { Functor, Monad, Tuple2 } from '@fp4ts/cats';
import { StateT, StateTF } from '@fp4ts/cats-mtl';
import { StateF } from '@fp4ts/fused-core';
import { Algebra, Carrier, Eff, Handler } from '@fp4ts/fused-kernel';

/**
 * A church-encoded `StateT` carrier for the `State` effect.
 */
export function StateTAlgebra<S, Sig, F>(
  F: Algebra<Sig, F>,
): Algebra<{ state: $<StateF, [S]> } | Sig, $<StateCF, [S, F]>> {
  return Algebra.withCarrier<$<StateF, [S]>, StateCF1<S>, 'state'>(
    new StateCarrier('state'),
  )(F);
}

class StateCarrier<S, N extends string> extends Carrier<
  $<StateF, [S]>,
  StateCF1<S>,
  N
> {
  public constructor(public readonly tag: N) {
    super();
  }

  monad<F>(F: Monad<F>): Monad<$<StateCF, [S, F]>> {
    return StateT.Monad(F);
  }

  eff<H, G, F, Sig, A>(
    F: Algebra<Sig, F>,
    H: Functor<H>,
    hdl: Handler<H, G, $<StateCF, [S, F]>>,
    { eff }: Eff<Record<N, $<StateF, [S]>>, G, A>,
    hu: Kind<H, [void]>,
  ): StateT<S, F, Kind<H, [A]>> {
    return eff.foldMap<[$<StateCF, [S, F]>, H]>(
      () => g => s => g(H.map_(hu, () => s))(s),
      s => g => _ => g(hu)(s),
    );
  }

  other<H, G, F, Sig, A>(
    F: Algebra<Sig, F>,
    H: Functor<H>,
    hdl: Handler<H, G, $<StateCF, [S, F]>>,
    eff: Eff<Sig, G, A>,
    hu: Kind<H, [void]>,
  ): StateT<S, F, Kind<H, [A]>> {
    return g => s =>
      F.flatMap_(
        F.eff(
          this.buildCtxFunctor(H),
          ([hx, s]) => StateT.runAS(F)(hdl(hx))(s),
          eff,
          [hu, s],
        ),
        ([ha, s]) => g(ha)(s),
      );
  }

  private buildCtxFunctor = cached(<H>(H: Functor<H>) =>
    Functor.compose(Tuple2.Bifunctor.leftFunctor<S>(), H),
  );
}

// -- HKT

export type StateCF = StateTF;
export interface StateCF1<S> extends TyK<[unknown]> {
  [$type]: $<StateCF, [S, TyVar<this, 0>]>;
}
