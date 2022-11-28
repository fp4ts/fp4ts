// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, cached, Kind, tupled, TyK, TyVar } from '@fp4ts/core';
import { Functor, Left, Monad, Right, Tuple2 } from '@fp4ts/cats';
import { Algebra, Carrier, Eff, Handler } from '@fp4ts/fused-kernel';
import { StateF } from '@fp4ts/fused-core';

/**
 * A carrier for the `State` effect.
 */
export type StateC<S, F, A> = (s: S) => Kind<F, [[A, S]]>;
export const StateC = Object.freeze({
  Monad: <S, F>(F: Monad<F>): Monad<$<StateCF, [S, F]>> => stateCMonad(F),

  Algebra: <S, Sig, F>(
    F: Algebra<Sig, F>,
  ): Algebra<{ state: $<StateF, [S]> } | Sig, $<StateCF, [S, F]>> =>
    Algebra.withCarrier<$<StateF, [S]>, StateCF1<S>, 'state'>(
      new StateCarrier('state'),
    )(F),
});

// -- Instances

class StateCarrier<S, N extends string> extends Carrier<
  $<StateF, [S]>,
  StateCF1<S>,
  N
> {
  public constructor(public readonly tag: N) {
    super();
  }

  monad<F>(F: Monad<F>): Monad<$<StateCF, [S, F]>> {
    return StateC.Monad(F);
  }

  eff<H, G, F, Sig, A>(
    F: Algebra<Sig, F>,
    H: Functor<H>,
    hdl: Handler<H, G, $<StateCF, [S, F]>>,
    { eff }: Eff<Record<N, $<StateF, [S]>>, G, A>,
    hu: Kind<H, [void]>,
  ): StateC<S, F, Kind<H, [A]>> {
    return eff.foldMap<[$<StateCF, [S, F]>, H]>(
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
    hdl: Handler<H, G, $<StateCF, [S, F]>>,
    eff: Eff<Sig, G, A>,
    hu: Kind<H, [void]>,
  ): StateC<S, F, Kind<H, [A]>> {
    return s =>
      F.eff(this.buildCtxFunctor(H), ([hx, s]) => hdl(hx)(s), eff, [hu, s]);
  }

  private buildCtxFunctor = cached(<H>(H: Functor<H>) =>
    Functor.compose(Tuple2.Bifunctor.leftFunctor<S>(), H),
  );
}

const stateCMonad = <S, F>(F: Monad<F>): Monad<$<StateCF, [S, F]>> =>
  Monad.of<$<StateCF, [S, F]>>({
    pure: a => s => F.pure([a, s]),
    map_: (fa, f) => s => F.map_(fa(s), ([a, s]) => [f(a), s]),
    flatMap_: (fa, f) => s => F.flatMap_(fa(s), ([a, s]) => f(a)(s)),
    tailRecM_: (x, f) => s1 =>
      F.tailRecM_(tupled(x, s1), ([x, s]) =>
        F.map_(f(x)(s), ([ea, s]) =>
          ea.fold(
            a => Left(tupled(a, s)),
            b => Right(tupled(b, s)),
          ),
        ),
      ),
  });

// -- HKT

export interface StateCF extends TyK<[unknown, unknown, unknown]> {
  [$type]: StateC<TyVar<this, 0>, TyVar<this, 1>, TyVar<this, 2>>;
}
export interface StateCF1<S> extends TyK<[unknown]> {
  [$type]: $<StateCF, [S, TyVar<this, 0>]>;
}
