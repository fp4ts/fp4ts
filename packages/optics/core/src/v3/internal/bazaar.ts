// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Applicative, Contravariant, Functor } from '@fp4ts/cats';
import {
  $,
  $type,
  Eval,
  F1,
  Kind,
  lazy,
  throwError,
  TyK,
  TyVar,
} from '@fp4ts/core';

export type BazaarT<P, Q, A, B, T> = {
  _Q?: Q;
  <F>(F: Applicative<F>): (pafb: Kind<P, [A, Kind<F, [B]>]>) => Kind<F, [T]>;
};

export const BazaarT = function () {};

// -- Instances

const bazaarTFunctor = lazy(
  <P, Q, A, B>(): Functor<$<BazaarTF, [P, Q, A, B]>> =>
    Functor.of({
      map_:
        <U, T>(bu: BazaarT<P, Q, A, B, U>, f: (u: U) => T) =>
        <F>(F: Applicative<F>) =>
          F1.andThen(bu(F), F.map(f)),
    }),
) as <P, Q, A, B>() => Functor<$<BazaarTF, [P, Q, A, B]>>;

const bazaarTContravariant = lazy(
  <P, Q, A, B>(): Contravariant<$<BazaarTF, [P, Q, A, B]>> =>
    Contravariant.of({
      contramap_:
        <U, T>(bu: BazaarT<P, Q, A, B, U>, f: (t: T) => U) =>
        <F>(F: Applicative<F>) =>
          F1.andThen(
            bu(F),
            F.map(_ => throwError(new Error('Contramap called'))),
          ),
    }),
) as <P, Q, A, B>(
  Q: Contravariant<Q>,
) => Contravariant<$<BazaarTF, [P, Q, A, B]>>;

const bazaarTApplicative = lazy(
  <P, Q, A, B>(): Applicative<$<BazaarTF, [P, Q, A, B]>> =>
    Applicative.of({
      ...bazaarTFunctor(),
      pure:
        <T>(t: T) =>
        <F>(F: Applicative<F>) =>
        (_: Kind<P, [A, Kind<F, [B]>]>) =>
          F.pure(t),

      ap_: (<U, T>(
        but: BazaarT<P, Q, A, B, (u: U) => T>,
        bu: BazaarT<P, Q, A, B, U>,
      ): any =>
        F1.flatMap(but, but =>
          F1.flatMap(
            bu,
            bu =>
              <F>(F: Applicative<F>): any =>
                F1.flatMap(but, fut =>
                  F1.andThen(bu, fu => F.ap_(fut as any, fu as any)),
                ),
          ),
        )) as Applicative<$<BazaarTF, [P, Q, A, B]>>['ap_'],

      map2_: (<U, V, T>(
        bu: BazaarT<P, Q, A, B, U>,
        bv: BazaarT<P, Q, A, B, V>,
        f: (u: U, v: V) => T,
      ): any =>
        F1.flatMap(bu, bu =>
          F1.flatMap(
            bv,
            bv =>
              <F>(F: Applicative<F>) =>
                F1.flatMap(bu, fu =>
                  F1.andThen(bv, fv => F.map2_(fu as any, fv as any, f)),
                ),
          ),
        )) as Applicative<$<BazaarTF, [P, Q, A, B]>>['map2_'],

      map2Eval_: (<U, V, T>(
        bu: BazaarT<P, Q, A, B, U>,
        ebv: Eval<BazaarT<P, Q, A, B, V>>,
        f: (u: U, v: V) => T,
      ): any =>
        Eval.now(
          <F>(F: Applicative<F>) =>
            (pafb: Kind<P, [A, Kind<F, [B]>]>) =>
              F.map2Eval_(
                bu(F)(pafb as any) as any,
                ebv.map(bv => bv(F)(pafb)),
                f,
              ).value,
        )) as Applicative<$<BazaarTF, [P, Q, A, B]>>['map2Eval_'],
    }),
) as <P, Q, A, B>() => Applicative<$<BazaarTF, [P, Q, A, B]>>;

BazaarT.Functor = bazaarTFunctor;
BazaarT.Contravariant = bazaarTContravariant;
BazaarT.Applicative = bazaarTApplicative;

// -- HKT

export interface BazaarTF
  extends TyK<[unknown, unknown, unknown, unknown, unknown]> {
  [$type]: BazaarT<
    TyVar<this, 0>,
    TyVar<this, 1>,
    TyVar<this, 2>,
    TyVar<this, 3>,
    TyVar<this, 4>
  >;
}
