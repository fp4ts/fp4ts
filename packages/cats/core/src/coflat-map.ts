// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Functor, FunctorRequirements } from './functor';

export interface CoflatMap<F> extends Functor<F> {
  coflatMap<A, B>(
    f: (fa: Kind<F, [A]>) => B,
  ): (fa: Kind<F, [A]>) => Kind<F, [B]>;
  coflatMap_<A, B>(fa: Kind<F, [A]>, f: (fa: Kind<F, [A]>) => B): Kind<F, [B]>;

  coflatten<A>(fa: Kind<F, [A]>): Kind<F, [Kind<F, [A]>]>;
}

export type CoflatMapRequirements<F> = Pick<CoflatMap<F>, 'coflatMap_'> &
  FunctorRequirements<F> &
  Partial<CoflatMap<F>>;
export const CoflatMap = Object.freeze({
  of: <F>(F: CoflatMapRequirements<F>): CoflatMap<F> => {
    const self: CoflatMap<F> = {
      coflatMap: f => fa => self.coflatMap_(fa, f),
      coflatten: fa => self.coflatMap_(fa, fa => fa),
      ...Functor.of(F),
      ...F,
    };

    return self;
  },
});
