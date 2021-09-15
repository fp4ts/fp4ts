import { Kind, AnyK } from '../core';
import { Functor, FunctorRequirements } from './functor';

export interface Apply<F extends AnyK> extends Functor<F> {
  readonly ap: <A>(
    fa: Kind<F, [A]>,
  ) => <B>(ff: Kind<F, [(a: A) => B]>) => Kind<F, [B]>;

  readonly ap_: <A, B>(
    ff: Kind<F, [(a: A) => B]>,
    fa: Kind<F, [A]>,
  ) => Kind<F, [B]>;

  readonly map2: <A, B, D>(
    fb: Kind<F, [B]>,
    f: (a: A, b: B) => D,
  ) => (fa: Kind<F, [A]>) => Kind<F, [D]>;
  readonly map2_: <A, B>(
    fa: Kind<F, [A]>,
    fb: Kind<F, [B]>,
  ) => <D>(f: (a: A, b: B) => D) => Kind<F, [D]>;

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

export type ApplyRequirements<F extends AnyK> = Pick<Apply<F>, 'ap_'> &
  FunctorRequirements<F> &
  Partial<Apply<F>>;
export const Apply = Object.freeze({
  of: <F extends AnyK>(F: ApplyRequirements<F>): Apply<F> => {
    const self: Apply<F> = {
      ap: fa => ff => self.ap_(ff, fa),

      product: fb => fa => self.product_(fa, fb),
      product_: <A, B>(fa: Kind<F, [A]>, fb: Kind<F, [B]>) =>
        F.ap_(
          F.map_(fa, a => (b: B) => [a, b] as [A, B]),
          fb,
        ),

      map2: (fb, f) => fa => self.map2_(fa, fb)(f),
      map2_: (fa, fb) => f =>
        self.map_(self.product_(fa, fb), ([a, b]) => f(a, b)),

      productL: fb => fa => self.productL_(fa, fb),
      productL_: (fa, fb) => self.map_(self.product_(fa, fb), ([a]) => a),

      productR: fb => fa => self.productR_(fa, fb),
      productR_: (fa, fb) => self.map_(self.product_(fa, fb), ([, b]) => b),

      ...Functor.of<F>(F),
      ...F,
    };

    return self;
  },
});
