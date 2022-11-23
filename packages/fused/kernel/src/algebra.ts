// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { id, Kind } from '@fp4ts/core';
import {
  Eval,
  EvalF,
  Functor,
  Identity,
  IdentityF,
  Monad,
  MonadRequirements,
} from '@fp4ts/cats';

import { Eff } from './eff';
import { Handler } from './handler';
import { Carrier } from './carrier';

/**
 * Provides interpretation of an effect signature `Sig` within a given carrier
 * monad `F`.
 *
 * Signature type `Sig` is expected to be a intersection of tagged effect type
 * constructors `Record<N1, E2> & Record<N2, E2> & ... & Record<Nn, En>`.
 */
export interface Algebra<Sig, F> extends Monad<F> {
  /**
   * Request an effect of signature `Sig` to be interpreted into a carrier
   * monad `F`.
   */
  send<N extends keyof Sig>(
    tag: N,
  ): <A>(eff: Kind<Sig[N], [F, A]>) => Kind<F, [A]>;

  /**
   * Interpret an effect of signature `Sig`, running any nested effects/actions
   * using provided `Handler` using initial context in `H`.
   */
  eff<H, G, A>(
    H: Functor<H>,
    hdl: Handler<H, G, F>,
    eff: Eff<Sig, G, A>,
    ctx: Kind<H, [void]>,
  ): Kind<F, [Kind<H, [A]>]>;
}

export type AlgebraRequirements<Sig, F> = Pick<Algebra<Sig, F>, 'eff'> &
  MonadRequirements<F> &
  Partial<Algebra<Sig, F>>;
export const Algebra = Object.freeze({
  of: <Sig, F>(F: AlgebraRequirements<Sig, F>): Algebra<Sig, F> => {
    const self: Algebra<Sig, F> = {
      send:
        <N extends keyof Sig>(tag: N) =>
        <A>(eff: Kind<Sig[N], [F, A]>) =>
          F.eff(Identity.Functor, id, { tag, eff }, undefined),

      ...Monad.of(F),
      ...F,
    };
    return self;
  },

  get Id(): Algebra<Record<never, never>, IdentityF> {
    return Algebra.of({ eff: (H, hdl, eff, hu) => eff, ...Identity.Monad });
  },
  get Eval(): Algebra<Record<never, never>, EvalF> {
    return Algebra.of({ eff: (H, hdl, eff, hu) => eff, ...Eval.Monad });
  },

  /**
   * Using the carrier `C` create a new instance of `Algebra` interpreting
   * an additional effect `E` tagged by `N`.
   */
  withCarrier:
    <E, C, N extends string>(C: Carrier<E, C, N>) =>
    <Sig, F>(F: Algebra<Sig, F>): Algebra<Record<N, E> & Sig, Kind<C, [F]>> =>
      Algebra.of<Record<N, E> & Sig, Kind<C, [F]>>({
        eff: (<H, G, A>(
          H: Functor<H>,
          hdl: Handler<H, G, Kind<C, [F]>>,
          eff: Eff<Record<N, E> & Sig, G, A>,
          hu: Kind<H, [void]>,
        ): Kind<Kind<C, [F]>, [Kind<H, [A]>]> =>
          eff.tag === C.tag
            ? C.eff(F, H, hdl, eff as Eff<Record<N, E>, G, A>, hu)
            : C.other(F, H, hdl, eff as Eff<Sig, G, A>, hu)) as any as Algebra<
          Record<N, E> & Sig,
          Kind<C, [F]>
        >['eff'],

        ...C.monad(F),
      }),
});
