// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { id, Kind } from '@fp4ts/core';
import { Either } from '@fp4ts/cats-core/lib/data';
import { Choice } from '@fp4ts/cats-profunctor';
import { Arrow, ArrowRequirements } from './arrow';
import { functionArrowChoice } from './instances/function';
import { Monad } from '@fp4ts/cats-core';
import { kleisliArrowChoice } from './instances/kleisli';

/**
 * @category Type Class
 * @category Arrow
 */
export interface ArrowChoice<P> extends Arrow<P>, Choice<P> {
  choose<C, D>(
    g: Kind<P, [C, D]>,
  ): <A, B>(f: Kind<P, [A, B]>) => Kind<P, [Either<A, C>, Either<B, D>]>;
  choose_<A, B, C, D>(
    f: Kind<P, [A, B]>,
    g: Kind<P, [C, D]>,
  ): Kind<P, [Either<A, C>, Either<B, D>]>;

  choice<B, C>(
    g: Kind<P, [B, C]>,
  ): <A>(f: Kind<P, [A, C]>) => Kind<P, [Either<A, B>, C]>;
  choice_<A, B, C>(
    f: Kind<P, [A, C]>,
    g: Kind<P, [B, C]>,
  ): Kind<P, [Either<A, B>, C]>;

  codiagonal<A>(): Kind<P, [Either<A, A>, A]>;
}

export type ArrowChoiceRequirements<P> = Pick<ArrowChoice<P>, 'choose_'> &
  ArrowRequirements<P> &
  Partial<ArrowChoice<P>>;
export const ArrowChoice = Object.freeze({
  of: <P>(P: ArrowChoiceRequirements<P>): ArrowChoice<P> => {
    const A = Arrow.of(P);
    const self: ArrowChoice<P> = {
      choose: g => f => self.choose_(f, g),

      choice: g => f => self.choice_(f, g),
      choice_: (f, g) => self.rmap_(self.choose_(f, g), ea => ea.fold(id, id)),

      codiagonal: <A>() => self.choice_(self.id<A>(), self.id<A>()),

      ...Choice.of({
        left:
          P.left ??
          (<C>() =>
            pab =>
              self.choose_(pab, self.id<C>())),

        right:
          P.right ??
          (<C>() =>
            pab =>
              self.choose_(self.id<C>(), pab)),

        ...A,
        ...P,
      }),
      ...A,
      ...P,
    };
    return self;
  },

  get Function1() {
    return functionArrowChoice();
  },

  Kleisli: <F>(F: Monad<F>) => kleisliArrowChoice(F),
});
