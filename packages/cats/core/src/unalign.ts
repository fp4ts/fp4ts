// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { id, Kind } from '@fp4ts/core';
import { Align, AlignRequirements } from './align';
import { Ior } from './data';
import { ArrayF, arrayUnalign } from './instances/array';

/**
 * @category Type Class
 */
export interface Unalign<F> extends Align<F> {
  unalign<A, B>(fab: Kind<F, [Ior<A, B>]>): [Kind<F, [A]>, Kind<F, [B]>];

  unalignWith<A, B, C>(
    f: (a: A) => Ior<B, C>,
  ): (fa: Kind<F, [A]>) => [Kind<F, [B]>, Kind<F, [C]>];
  unalignWith_<A, B, C>(
    fa: Kind<F, [A]>,
    f: (a: A) => Ior<B, C>,
  ): [Kind<F, [B]>, Kind<F, [C]>];
}

export type UnalignRequirements<F> = (
  | Pick<Unalign<F>, 'unalign'>
  | Pick<Unalign<F>, 'unalignWith_'>
) &
  AlignRequirements<F> &
  Partial<Unalign<F>>;
export const Unalign = Object.freeze({
  of: <F>(F: UnalignRequirements<F>): Unalign<F> => {
    const self: Unalign<F> = {
      unalign: F.unalign ?? (fab => self.unalignWith_(fab, id)),
      unalignWith: f => fa => self.unalignWith_(fa, f),
      unalignWith_:
        F.unalignWith_ ?? ((fa, f) => self.unalign(self.map_(fa, f))),
      ...Align.of(F),
      ...F,
    };
    return self;
  },

  get Array(): Unalign<ArrayF> {
    return arrayUnalign();
  },
});
