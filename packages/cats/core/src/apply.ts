// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { HKT, HKT1, Kind } from '@fp4ts/core';
import { Eval } from './eval';
import { ComposedApply } from './composed';
import { Functor, FunctorRequirements } from './functor';

/**
 * @category Type Class
 */
export interface Apply<F> extends Functor<F> {
  readonly ap: <A>(
    fa: Kind<F, [A]>,
  ) => <B>(ff: Kind<F, [(a: A) => B]>) => Kind<F, [B]>;

  readonly ap_: <A, B>(
    ff: Kind<F, [(a: A) => B]>,
    fa: Kind<F, [A]>,
  ) => Kind<F, [B]>;

  readonly map2: <A, B, C>(
    fb: Kind<F, [B]>,
    f: (a: A, b: B) => C,
  ) => (fa: Kind<F, [A]>) => Kind<F, [C]>;
  readonly map2_: <A, B>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
  ) => <C>(f: (a: A, b: B) => C) => Kind<F, [C]>;

  readonly map3: <A, B, C, D>(
    fb: Kind<F, [B]>,
    fc: Kind<F, [C]>,
    f: (a: A, b: B, c: C) => D,
  ) => (fa: Kind<F, [A]>) => Kind<F, [D]>;
  readonly map3_: <A, B, C>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
    fC: Kind<F, [C]>,
  ) => <D>(f: (a: A, b: B, c: C) => D) => Kind<F, [D]>;

  readonly map2Eval: <A, B, D>(
    fb: Eval<Kind<F, [B]>>,
    f: (a: A, b: B) => D,
  ) => (fa: Kind<F, [A]>) => Eval<Kind<F, [D]>>;
  readonly map2Eval_: <A, B>(
    fa: Kind<F, [A]>,
    fb: Eval<Kind<F, [B]>>,
  ) => <D>(f: (a: A, b: B) => D) => Eval<Kind<F, [D]>>;

  readonly product: <B>(
    fb: Kind<F, [B]>,
  ) => <A>(fa: Kind<F, [A]>) => Kind<F, [[A, B]]>;
  readonly product_: <A, B>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
  ) => Kind<F, [[A, B]]>;

  readonly productL: <B>(
    fb: Kind<F, [B]>,
  ) => <A>(fa: Kind<F, [A]>) => Kind<F, [A]>;
  readonly productL_: <A, B>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
  ) => Kind<F, [A]>;

  readonly productR: <B>(
    fb: Kind<F, [B]>,
  ) => <A>(fa: Kind<F, [A]>) => Kind<F, [B]>;
  readonly productR_: <A, B>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
  ) => Kind<F, [B]>;
}

export type ApplyRequirements<F> = Pick<Apply<F>, 'ap_'> &
  FunctorRequirements<F> &
  Partial<Apply<F>>;
function of<F>(F: ApplyRequirements<F>): Apply<F>;
function of<F>(F: ApplyRequirements<HKT1<F>>): Apply<HKT1<F>> {
  const self: Apply<HKT1<F>> = {
    ap: fa => ff => self.ap_(ff, fa),

    product: fb => fa => self.product_(fa, fb),
    product_: <A, B>(fa: HKT<F, [A]>, fb: HKT<F, [B]>) =>
      F.ap_(
        F.map_(fa, a => (b: B) => [a, b] as [A, B]),
        fb,
      ),

    map2: (fb, f) => fa => self.map2_(fa, fb)(f),
    map2_: (fa, fb) => f =>
      self.map_(self.product_(fa, fb), ([a, b]) => f(a, b)),

    map3: (fb, fc, f) => fa => self.map3_(fa, fb, fc)(f),
    map3_: (fa, fb, fc) => f =>
      self.map_(self.product_(fa, self.product_(fb, fc)), ([a, [b, c]]) =>
        f(a, b, c),
      ),

    map2Eval: (fb, f) => fa => self.map2Eval_(fa, fb)(f),
    map2Eval_: (fa, fb) => f => fb.map(fb => self.map2_(fa, fb)(f)),

    productL: fb => fa => self.productL_(fa, fb),
    productL_: (fa, fb) => self.map_(self.product_(fa, fb), ([a]) => a),

    productR: fb => fa => self.productR_(fa, fb),
    productR_: (fa, fb) => self.map_(self.product_(fa, fb), ([, b]) => b),

    ...Functor.of(F),
    ...F,
  };

  return self;
}
export const Apply = Object.freeze({
  of,

  compose: <F, G>(F: Apply<F>, G: Apply<G>): ComposedApply<F, G> =>
    ComposedApply(F, G),
});
