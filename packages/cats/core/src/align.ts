// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Base, instance, Kind } from '@fp4ts/core';
import { Semigroup } from '@fp4ts/cats-kernel';

import { Functor } from './functor';
import { Ior, Option } from './data';

/**
 * @category Type Class
 */
export interface Align<F> extends Base<F> {
  readonly functor: Functor<F>;

  align: <B>(fb: Kind<F, [B]>) => <A>(fa: Kind<F, [A]>) => Kind<F, [Ior<A, B>]>;
  align_: <A, B>(fa: Kind<F, [A]>, fb: Kind<F, [B]>) => Kind<F, [Ior<A, B>]>;

  alignWith: <A, B, C>(
    fb: Kind<F, [B]>,
    f: (ior: Ior<A, B>) => C,
  ) => (fa: Kind<F, [A]>) => Kind<F, [C]>;
  alignWith_: <A, B>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
  ) => <C>(f: (ior: Ior<A, B>) => C) => Kind<F, [C]>;

  alignCombine: <A>(
    A: Semigroup<A>,
  ) => (fb: Kind<F, [A]>) => (fa: Kind<F, [A]>) => Kind<F, [A]>;
  alignCombine_: <A>(
    A: Semigroup<A>,
  ) => (fa: Kind<F, [A]>, fb: Kind<F, [A]>) => Kind<F, [A]>;

  alignMergeWith: <A>(
    fb: Kind<F, [A]>,
    f: (l: A, r: A) => A,
  ) => (fa: Kind<F, [A]>) => Kind<F, [A]>;
  alignMergeWith_: <A>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [A]>,
  ) => (f: (l: A, r: A) => A) => Kind<F, [A]>;

  padZip: <B>(
    fb: Kind<F, [B]>,
  ) => <A>(fa: Kind<F, [A]>) => Kind<F, [Option<A>, Option<B>]>;
  padZip_: <A, B>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
  ) => Kind<F, [Option<A>, Option<B>]>;

  padZipWith: <A, B, C>(
    fb: Kind<F, [B]>,
    f: (l: Option<A>, r: Option<B>) => C,
  ) => (fa: Kind<F, [A]>) => Kind<F, [C]>;
  padZipWith_: <A, B>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
  ) => <C>(f: (l: Option<A>, r: Option<B>) => C) => Kind<F, [C]>;

  zipAll: <A, B>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
    a: A,
    b: B,
  ) => Kind<F, [[A, B]]>;
}

export type AlignRequirements<F> = Pick<Align<F>, 'align_' | 'functor'> &
  Partial<Align<F>>;
export const Align = Object.freeze({
  of: <F>(F: AlignRequirements<F>): Align<F> => {
    const self: Align<F> = instance<Align<F>>({
      align: fb => fa => self.align_(fa, fb),

      alignWith: (fb, f) => fa => self.alignWith_(fa, fb)(f),
      alignWith_: (fa, fb) => f => self.functor.map_(self.align_(fa, fb), f),

      alignCombine: S => fb => fa => self.alignCombine_(S)(fa, fb),
      alignCombine_: S => (fa, fb) =>
        self.functor.map_(self.align_(fa, fb), ior => ior.merge(S)),

      alignMergeWith: (fb, f) => fa => self.alignMergeWith_(fa, fb)(f),
      alignMergeWith_: (fa, fb) => f =>
        self.functor.map_(self.align_(fa, fb), ior => ior.mergeWith(f)),

      padZip: fb => fa => self.padZip_(fa, fb),
      padZip_: (fa, fb) => self.alignWith_(fa, fb)(ior => ior.pad),

      padZipWith: (fb, f) => fa => self.padZipWith_(fa, fb)(f),
      padZipWith_: (fa, fb) => f =>
        self.alignWith_(
          fa,
          fb,
        )(ior => {
          const [oa, ob] = ior.pad;
          return f(oa, ob);
        }),

      zipAll: (fa, fb, a, b) =>
        self.alignWith_(
          fa,
          fb,
        )(ior =>
          ior.fold(
            x => [x, b],
            x => [a, x],
            (a, b) => [a, b],
          ),
        ),

      ...F,
    });
    return self;
  },
});
