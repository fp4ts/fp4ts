// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Base, Kind, instance, $, EvalF } from '@fp4ts/core';
import { evalMonadDefer } from './instances/eval';
import {
  function0Defer,
  Function0F,
  Function1F,
  function1Defer,
} from './instances/function';

/**
 * @category Type Class
 */
export interface Defer<F> extends Base<F> {
  defer<A>(fa: () => Kind<F, [A]>): Kind<F, [A]>;

  fix<A>(f: (fa: Kind<F, [A]>) => Kind<F, [A]>): Kind<F, [A]>;
}

export type DeferRequirements<F> = Pick<Defer<F>, 'defer'> & Partial<Defer<F>>;
export const Defer = Object.freeze({
  of: <F>(F: DeferRequirements<F>): Defer<F> =>
    instance<Defer<F>>({
      fix: <A>(f: (fa: Kind<F, [A]>) => Kind<F, [A]>): Kind<F, [A]> => {
        const res: Kind<F, [A]> = f(F.defer(() => res));
        return res;
      },

      ...F,
    }),

  get Eval(): Defer<EvalF> {
    return evalMonadDefer();
  },

  get Function0(): Defer<Function0F> {
    return function0Defer();
  },

  Function1: <R>(): Defer<$<Function1F, [R]>> => function1Defer(),
});
