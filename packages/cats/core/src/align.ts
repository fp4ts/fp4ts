// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { id, instance, Kind } from '@fp4ts/core';

import { Functor, FunctorRequirements } from './functor';
import { Ior, Option } from './data';
import { ArrayF } from './instances/array';
import { Unalign } from './unalign';

/**
 * @category Type Class
 */
export interface Align<F> extends Functor<F> {
  align<B>(fb: Kind<F, [B]>): <A>(fa: Kind<F, [A]>) => Kind<F, [Ior<A, B>]>;
  align_<A, B>(fa: Kind<F, [A]>, fb: Kind<F, [B]>): Kind<F, [Ior<A, B>]>;

  alignWith<A, B, C>(
    fb: Kind<F, [B]>,
    f: (ior: Ior<A, B>) => C,
  ): (fa: Kind<F, [A]>) => Kind<F, [C]>;
  alignWith_<A, B, C>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
    f: (ior: Ior<A, B>) => C,
  ): Kind<F, [C]>;

  padZip<B>(
    fb: Kind<F, [B]>,
  ): <A>(fa: Kind<F, [A]>) => Kind<F, [[Option<A>, Option<B>]]>;
  padZip_<A, B>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
  ): Kind<F, [[Option<A>, Option<B>]]>;

  padZipWith<A, B, C>(
    fb: Kind<F, [B]>,
    f: (l: Option<A>, r: Option<B>) => C,
  ): (fa: Kind<F, [A]>) => Kind<F, [C]>;
  padZipWith_<A, B>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
  ): <C>(f: (l: Option<A>, r: Option<B>) => C) => Kind<F, [C]>;

  zipAll<A, B>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
    a: A,
    b: B,
  ): Kind<F, [[A, B]]>;
}

export type AlignRequirements<F> = (
  | Pick<Align<F>, 'align_'>
  | Pick<Align<F>, 'alignWith_'>
) &
  FunctorRequirements<F> &
  Partial<Align<F>>;
export const Align = Object.freeze({
  of: <F>(F: AlignRequirements<F>): Align<F> => {
    const self: Align<F> = instance<Align<F>>({
      align: fb => fa => self.align_(fa, fb),
      align_: F.align_ ?? ((fa, fb) => self.alignWith_(fa, fb, id)),

      alignWith: (fb, f) => fa => self.alignWith_(fa, fb, f),
      alignWith_:
        F.alignWith_ ?? ((fa, fb, f) => self.map_(self.align_(fa, fb), f)),

      padZip: fb => fa => self.padZip_(fa, fb),
      padZip_: (fa, fb) => self.alignWith_(fa, fb, ior => ior.pad),

      padZipWith: (fb, f) => fa => self.padZipWith_(fa, fb)(f),
      padZipWith_: (fa, fb) => f =>
        self.alignWith_(fa, fb, ior => {
          const [oa, ob] = ior.pad;
          return f(oa, ob);
        }),

      zipAll: (fa, fb, a, b) =>
        self.alignWith_(fa, fb, ior =>
          ior.fold(
            x => [x, b],
            x => [a, x],
            (a, b) => [a, b],
          ),
        ),
      ...Functor.of(F),
      ...F,
    });
    return self;
  },

  get Array(): Align<ArrayF> {
    return Unalign.Array;
  },
});
