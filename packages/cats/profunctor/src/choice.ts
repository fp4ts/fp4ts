// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Either } from '@fp4ts/cats-core/lib/data';
import { Profunctor, ProfunctorRequirements } from './profunctor';
import { Applicative, Function1F, Traversable } from '@fp4ts/cats-core';
import { function1Choice, function1Cochoice } from './instances/function';
import { kleisliChoice, kleisliCochoice } from './instances/kleisli';
import { cokleisliCochoice } from './instances/cokleisli';

/**
 * @category Type Class
 * @category Profunctor
 */
export interface Choice<P> extends Profunctor<P> {
  left<C>(): <A, B>(
    pab: Kind<P, [A, B]>,
  ) => Kind<P, [Either<A, C>, Either<B, C>]>;
  right<C>(): <A, B>(
    pab: Kind<P, [A, B]>,
  ) => Kind<P, [Either<C, A>, Either<C, B>]>;
}

export type ChoiceRequirements<F> = (
  | Pick<Choice<F>, 'left'>
  | Pick<Choice<F>, 'right'>
) &
  ProfunctorRequirements<F> &
  Partial<Choice<F>>;
export const Choice = Object.freeze({
  of: <P>(P: ChoiceRequirements<P>): Choice<P> => {
    const self: Choice<P> = {
      left:
        P.left ??
        (<C>() =>
          <A, B>(pab: Kind<P, [A, B]>): Kind<P, [Either<A, C>, Either<B, C>]> =>
            self.lmap_(self.rmap_(self.right<C>()(pab), swap), swap)),

      right:
        P.right ??
        (<C>() =>
          <A, B>(pab: Kind<P, [A, B]>): Kind<P, [Either<C, A>, Either<C, B>]> =>
            self.lmap_(self.rmap_(self.left<C>()(pab), swap), swap)),

      ...Profunctor.of(P),
      ...P,
    };
    return self;
  },

  get Function1(): Choice<Function1F> {
    return function1Choice();
  },

  Kleisli: <F>(F: Applicative<F>) => kleisliChoice(F),
});

/**
 * @category Type Class
 * @category Profunctor
 */
export interface Cochoice<P> extends Profunctor<P> {
  unleft<A, B, C>(
    pacbc: Kind<P, [Either<A, C>, Either<B, C>]>,
  ): Kind<P, [A, B]>;
  unright<A, B, C>(
    pcacb: Kind<P, [Either<C, A>, Either<C, B>]>,
  ): Kind<P, [A, B]>;
}

export type CochoiceRequirements<F> = (
  | Pick<Cochoice<F>, 'unleft'>
  | Pick<Cochoice<F>, 'unright'>
) &
  ProfunctorRequirements<F> &
  Partial<Cochoice<F>>;
export const Cochoice = Object.freeze({
  of: <P>(P: CochoiceRequirements<P>): Cochoice<P> => {
    const self: Cochoice<P> = {
      unleft:
        P.unleft ??
        (<A, B, C>(
          pacbc: Kind<P, [Either<A, C>, Either<B, C>]>,
        ): Kind<P, [A, B]> =>
          self.unright(self.lmap_(self.rmap_(pacbc, swap), swap))),

      unright:
        P.unright ??
        (<A, B, C>(
          pcacb: Kind<P, [Either<C, A>, Either<C, B>]>,
        ): Kind<P, [A, B]> =>
          self.unleft(self.lmap_(self.rmap_(pcacb, swap), swap))),

      ...Profunctor.of(P),
      ...P,
    };
    return self;
  },

  get Function1(): Cochoice<Function1F> {
    return function1Cochoice();
  },

  Kleisli: <F>(F: Traversable<F>) => kleisliCochoice(F),
  Cokleisli: <F>(F: Applicative<F>) => cokleisliCochoice(F),
});

const swap = <X, Y>(ea: Either<X, Y>): Either<Y, X> => ea.swapped;
