// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Comonad, Defer, Monad } from '@fp4ts/cats-core';
import { Costrong } from '@fp4ts/cats-profunctor';
import { Arrow, ArrowRequirements } from './arrow';
import { functionArrowLoop } from './instances/function';
import { kleisliArrowLoop } from './instances/kleisli';
import { cokleisliArrowLoop } from './instances/cokleisli';

/**
 * @category Type Class
 * @category Arrow
 */
export interface ArrowLoop<P> extends Arrow<P>, Costrong<P> {
  loop<F>(
    F: Defer<F>,
  ): <A, B, C>(
    pafcbfc: Kind<P, [[A, Kind<F, [C]>], [B, Kind<F, [C]>]]>,
  ) => Kind<P, [A, B]>;
  loop_<F, A, B, C>(
    F: Defer<F>,
    pafcbfc: Kind<P, [[A, Kind<F, [C]>], [B, Kind<F, [C]>]]>,
  ): Kind<P, [A, B]>;
}

export type ArrowLoopRequirements<P> = (
  | Pick<ArrowLoop<P>, 'loop_'>
  | Pick<ArrowLoop<P>, 'unfirst_'>
) &
  ArrowRequirements<P> &
  Partial<ArrowLoop<P>>;
export const ArrowLoop = Object.freeze({
  of: <P>(P: ArrowLoopRequirements<P>): ArrowLoop<P> => {
    const A = Arrow.of(P);
    const self: ArrowLoop<P> = {
      loop: F => pab => self.loop_(F, pab),
      loop_: P.loop_ ?? ((F, pab) => self.unfirst_(F, pab)),
      ...Costrong.of({
        ...A,
        unfirst_: P.unfirst_ ?? ((F, pab) => self.loop_(F, pab)),
      }),
      ...A,
      ...P,
    };
    return self;
  },

  get Function1() {
    return functionArrowLoop();
  },

  Kleisli: <F>(F: Monad<F>) => kleisliArrowLoop(F),

  Cokleisli: <F>(F: Comonad<F>) => cokleisliArrowLoop(F),
});
