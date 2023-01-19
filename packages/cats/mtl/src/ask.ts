// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Applicative, ApplicativeRequirements } from '@fp4ts/cats-core';
import { instance, Kind, pipe } from '@fp4ts/core';

export interface Ask<F, R> extends Applicative<F> {
  ask(): Kind<F, [R]>;
  reader<A>(f: (r: R) => A): Kind<F, [A]>;
}

export type AskRequirements<F, R> = Pick<Ask<F, R>, 'ask'> &
  ApplicativeRequirements<F> &
  Partial<Ask<F, R>>;
export const Ask = Object.freeze({
  of: <F, R>(F: AskRequirements<F, R>): Ask<F, R> => {
    const self: Ask<F, R> = instance<Ask<F, R>>({
      reader: f => pipe(self.ask(), self.map(f)),
      ...Applicative.of(F),
      ...F,
    });
    return self;
  },
});
