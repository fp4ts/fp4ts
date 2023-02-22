// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Defer, Functor } from '@fp4ts/cats-core';
import { Kind } from '@fp4ts/core';
import { cokleisliCostrong } from './instances/cokleisli';
import { function1Costrong, function1Strong } from './instances/function';
import { kleisliStrong } from './instances/kleisli';
import { Profunctor, ProfunctorRequirements } from './profunctor';

/**
 * @category Type Class
 * @category Profunctor
 */
export interface Strong<P> extends Profunctor<P> {
  first<C>(): <A, B>(pab: Kind<P, [A, B]>) => Kind<P, [[A, C], [B, C]]>;
  second<C>(): <A, B>(pab: Kind<P, [A, B]>) => Kind<P, [[C, A], [C, B]]>;
}

export type StrongRequirements<P> = (
  | Pick<Strong<P>, 'first'>
  | Pick<Strong<P>, 'second'>
) &
  ProfunctorRequirements<P> &
  Partial<Strong<P>>;
export const Strong = Object.freeze({
  of: <P>(P: StrongRequirements<P>): Strong<P> => {
    const self: Strong<P> = {
      first:
        P.first ??
        (<C>() =>
          <A, B>(pab: Kind<P, [A, B]>): Kind<P, [[A, C], [B, C]]> =>
            self.rmap_(self.lmap_(self.second<C>()(pab), swap), swap)),

      second:
        P.second ??
        (<C>() =>
          <A, B>(pab: Kind<P, [A, B]>): Kind<P, [[C, A], [C, B]]> =>
            self.rmap_(self.lmap_(self.first<C>()(pab), swap), swap)),

      ...Profunctor.of(P),
      ...P,
    };
    return self;
  },

  get Function1() {
    return function1Strong();
  },

  Kleisli: <F>(F: Functor<F>) => kleisliStrong(F),
});

/**
 * @category Type Class
 * @category Profunctor
 */
export interface Costrong<P> extends Profunctor<P> {
  unfirst<F>(
    F: Defer<F>,
  ): <A, B, C>(
    pafcbfc: Kind<P, [[A, Kind<F, [C]>], [B, Kind<F, [C]>]]>,
  ) => Kind<P, [A, B]>;
  unfirst_<F, A, B, C>(
    F: Defer<F>,
    pafcbfc: Kind<P, [[A, Kind<F, [C]>], [B, Kind<F, [C]>]]>,
  ): Kind<P, [A, B]>;

  unsecond<F>(
    F: Defer<F>,
  ): <A, B, C>(
    pfcafcb: Kind<P, [[Kind<F, [C]>, A], [Kind<F, [C]>, B]]>,
  ) => Kind<P, [A, B]>;
  unsecond_<F, A, B, C>(
    F: Defer<F>,
    pfcafcb: Kind<P, [[Kind<F, [C]>, A], [Kind<F, [C]>, B]]>,
  ): Kind<P, [A, B]>;
}

export type CostrongRequirements<P> = (
  | Pick<Costrong<P>, 'unfirst_'>
  | Pick<Costrong<P>, 'unsecond_'>
) &
  ProfunctorRequirements<P> &
  Partial<Costrong<P>>;
export const Costrong = Object.freeze({
  of: <P>(P: CostrongRequirements<P>): Costrong<P> => {
    const self: Costrong<P> = {
      unfirst: F => pacfbcf => self.unfirst_(F, pacfbcf),
      unfirst_:
        P.unfirst_ ??
        (<F, A, B, C>(
          F: Defer<F>,
          pafcbfc: Kind<P, [[A, Kind<F, [C]>], [B, Kind<F, [C]>]]>,
        ): Kind<P, [A, B]> =>
          self.unsecond_(F, self.lmap_(self.rmap_(pafcbfc, swap), swap))),

      unsecond: F => pfcafcb => self.unsecond_(F, pfcafcb),
      unsecond_:
        P.unsecond_ ??
        (<F, A, B, C>(
          F: Defer<F>,
          pfcafcb: Kind<P, [[Kind<F, [C]>, A], [Kind<F, [C]>, B]]>,
        ): Kind<P, [A, B]> =>
          self.unfirst_(F, self.lmap_(self.rmap_(pfcafcb, swap), swap))),

      ...Profunctor.of(P),
      ...P,
    };
    return self;
  },

  get Function1() {
    return function1Costrong();
  },

  Cokleisli: <F>(F: Functor<F>) => cokleisliCostrong(F),
});

const swap = <X, Y>([x, y]: readonly [X, Y]): [Y, X] => [y, x];
