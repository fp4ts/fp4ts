// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Base, Kind, instance, HKT1, HKT } from '@fp4ts/core';

/**
 * @category Type Class
 */
export interface Defer<F> extends Base<F> {
  readonly defer: <A>(fa: () => Kind<F, [A]>) => Kind<F, [A]>;

  readonly fix: <A>(f: (fa: Kind<F, [A]>) => Kind<F, [A]>) => Kind<F, [A]>;
}

export type DeferRequirements<F> = Pick<Defer<F>, 'defer'> & Partial<Defer<F>>;

function of<F>(F: DeferRequirements<F>): Defer<F>;
function of<F>(F: DeferRequirements<HKT1<F>>): Defer<HKT1<F>> {
  return instance<Defer<HKT1<F>>>({
    fix: <A>(f: (fa: HKT<F, [A]>) => HKT<F, [A]>): HKT<F, [A]> => {
      const res: HKT<F, [A]> = F.defer(() => f(res));
      return res;
    },

    ...F,
  });
}

export const Defer = Object.freeze({
  of,
});
