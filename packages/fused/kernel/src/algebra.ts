// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { EvalF, id, Kind, throwError } from '@fp4ts/core';
import {
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
 * Signature type `Sig` is expected to be a union of tagged effect type
 * constructors `Record<N1, E2> | Record<N2, E2> | ... | Record<Nn, En>`.
 */
export interface Algebra<in Sig, F> extends Monad<F> {
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
  eff<H, G, A, k extends keyof Sig>(
    H: Functor<H>,
    hdl: Handler<H, G, F>,
    eff: { tag: k; eff: Kind<Sig[k], [G, A]> },
    ctx: Kind<H, [void]>,
  ): Kind<F, [Kind<H, [A]>]>;
}

export type AlgebraRequirements<Sig, F> = Pick<Algebra<Sig, F>, 'eff'> &
  MonadRequirements<F> &
  Partial<Algebra<Sig, F>>;
export const Algebra = Object.freeze({
  of: <Sig, F>(F: AlgebraRequirements<Sig, F>): Algebra<Sig, F> => {
    const self: Algebra<Sig, F> = {
      send<N extends keyof Sig>(tag: N) {
        return <A>(eff: Kind<Sig[N], [F, A]>) =>
          this.eff(Identity.Functor, id, { tag, eff }, undefined);
      },

      ...Monad.of(F),
      ...F,
    };
    return self;
  },

  get Id(): Algebra<never, IdentityF> {
    return Algebra.of({
      eff: (H, hdl, eff, hu) => throwError(new Error('no eff to pass in')),
      ...Identity.Monad,
    });
  },
  get Eval(): Algebra<never, EvalF> {
    return Algebra.of({
      eff: (H, hdl, eff, hu) => throwError(new Error('no eff to pass in')),
      ...Monad.Eval,
    });
  },

  /**
   * Using the carrier `C` create a new instance of `Algebra` interpreting
   * an additional effect `E` tagged by `N`.
   */
  withCarrier:
    <E, C, N extends string>(C: Carrier<E, C, N>) =>
    <Sig, F>(F: Algebra<Sig, F>): Algebra<Record<N, E> | Sig, Kind<C, [F]>> =>
      Algebra.of<Record<N, E> | Sig, Kind<C, [F]>>({
        eff: (<H, G, A>(
          H: Functor<H>,
          hdl: Handler<H, G, Kind<C, [F]>>,
          eff: Eff<Record<N, E> | Sig, G, A>,
          hu: Kind<H, [void]>,
        ): Kind<Kind<C, [F]>, [Kind<H, [A]>]> =>
          eff.tag === C.tag
            ? C.eff(F, H, hdl, eff as Eff<Record<N, E>, G, A>, hu)
            : C.other(F, H, hdl, eff as Eff<Sig, G, A>, hu)) as any as Algebra<
          Record<N, E> | Sig,
          Kind<C, [F]>
        >['eff'],

        ...C.monad(F),
      }),
});
