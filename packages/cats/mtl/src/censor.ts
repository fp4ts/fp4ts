// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { instance, Kind } from '@fp4ts/core';
import { Applicative, ApplicativeRequirements } from '@fp4ts/cats-core';
import { Monoid } from '@fp4ts/cats-kernel';
import { Listen, ListenRequirements } from './listen';

export interface Censor<F, W> extends Applicative<F>, Listen<F, W> {
  readonly monoid: Monoid<W>;

  censor(f: (w: W) => W): <A>(fa: Kind<F, [A]>) => Kind<F, [A]>;
  censor_<A>(fa: Kind<F, [A]>, f: (w: W) => W): Kind<F, [A]>;

  clear<A>(fa: Kind<F, [A]>): Kind<F, [A]>;
}

export type CensorRequirements<F, W> = Pick<
  Censor<F, W>,
  'censor_' | 'monoid'
> &
  ListenRequirements<F, W> &
  ApplicativeRequirements<F> &
  Partial<Censor<F, W>>;
export const Censor = Object.freeze({
  of: <F, W>(F: CensorRequirements<F, W>): Censor<F, W> => {
    const A = Applicative.of(F);
    const self: Censor<F, W> = instance<Censor<F, W>>({
      censor: f => fa => self.censor_(fa, f),
      clear: fa => self.censor_(fa, () => self.monoid.empty),
      ...Listen.of({ ...A, ...F }),
      ...A,
      ...F,
    });
    return self;
  },
});
