// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, cached, Kind, tupled, TyK, TyVar } from '@fp4ts/core';
import { Functor, Monad, Tuple2 } from '@fp4ts/cats';
import { IxStateT, IxStateTF } from '@fp4ts/cats-mtl';
import { StateF } from '@fp4ts/fused-core';
import { Algebra, Carrier, Eff, Handler } from '@fp4ts/fused-kernel';

/**
 * An `IxStateT` carrier for the `State` effect.
 */
export function IxStateTAlgebra<S, Sig, F>(
  F: Algebra<Sig, F>,
): Algebra<{ state: $<StateF, [S]> } | Sig, $<StateCF, [S, S, F]>> {
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

  monad<F>(F: Monad<F>): Monad<$<StateCF, [S, S, F]>> {
    return IxStateT.Monad(F);
  }

  eff<H, G, F, Sig, A>(
    F: Algebra<Sig, F>,
    H: Functor<H>,
    hdl: Handler<H, G, $<StateCF, [S, S, F]>>,
    { eff }: Eff<Record<N, $<StateF, [S]>>, G, A>,
    hu: Kind<H, [void]>,
  ): IxStateT<S, S, F, Kind<H, [A]>> {
    return eff.foldMap<[$<StateCF, [S, S, F]>, H]>(
      () => s =>
        F.pure(
          tupled(
            H.map_(hu, () => s),
            s,
          ),
        ),
      s => _ => F.pure(tupled(hu, s)),
    );
  }

  other<H, G, F, Sig, A>(
    F: Algebra<Sig, F>,
    H: Functor<H>,
    hdl: Handler<H, G, $<StateCF, [S, S, F]>>,
    eff: Eff<Sig, G, A>,
    hu: Kind<H, [void]>,
  ): IxStateT<S, S, F, Kind<H, [A]>> {
    return s =>
      F.eff(this.buildCtxFunctor(H), ([hx, s]) => hdl(hx)(s), eff, [hu, s]);
  }

  private buildCtxFunctor = cached(<H>(H: Functor<H>) =>
    Functor.compose(Tuple2.Bifunctor.leftFunctor<S>(), H),
  );
}

// -- HKT

export type StateCF = IxStateTF;
export interface StateCF1<S> extends TyK<[unknown]> {
  [$type]: $<StateCF, [S, S, TyVar<this, 0>]>;
}
