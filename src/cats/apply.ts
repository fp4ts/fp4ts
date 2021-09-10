import { Auto, Kind } from '../core';
import { Functor, FunctorRequirements } from './functor';

export interface Apply<F, C = Auto> extends Functor<F, C> {
  readonly ap: <S, R, E, A>(
    fa: Kind<F, C, S, R, E, A>,
  ) => <B>(ff: Kind<F, C, S, R, E, (a: A) => B>) => Kind<F, C, S, R, E, B>;
  readonly ap_: <S, R, E, A, B>(
    ff: Kind<F, C, S, R, E, (a: A) => B>,
    fa: Kind<F, C, S, R, E, A>,
  ) => Kind<F, C, S, R, E, B>;

  readonly map2: <CC, S, R, E, A, B, C>(
    fb: Kind<F, CC, S, R, E, B>,
    f: (a: A, b: B) => C,
  ) => (fa: Kind<F, CC, S, R, E, A>) => Kind<F, CC, S, R, E, C>;
  readonly map2_: <CC, S, R, E, A, B>(
    fa: Kind<F, CC, S, R, E, A>,
    fb: Kind<F, CC, S, R, E, B>,
  ) => <C>(f: (a: A, b: B) => C) => Kind<F, CC, S, R, E, C>;

  readonly product: <S, R, E, B>(
    fb: Kind<F, C, S, R, E, B>,
  ) => <A>(fa: Kind<F, C, S, R, E, A>) => Kind<F, C, S, R, E, [A, B]>;
  readonly product_: <S, R, E, A, B>(
    fa: Kind<F, C, S, R, E, A>,
    fb: Kind<F, C, S, R, E, B>,
  ) => Kind<F, C, S, R, E, [A, B]>;

  readonly productL: <S, R, E, B>(
    fb: Kind<F, C, S, R, E, B>,
  ) => <A>(fa: Kind<F, C, S, R, E, A>) => Kind<F, C, S, R, E, A>;
  readonly productL_: <S, R, E, A, B>(
    fa: Kind<F, C, S, R, E, A>,
    fb: Kind<F, C, S, R, E, B>,
  ) => Kind<F, C, S, R, E, A>;

  readonly productR: <S, R, E, B>(
    fb: Kind<F, C, S, R, E, B>,
  ) => <A>(fa: Kind<F, C, S, R, E, A>) => Kind<F, C, S, R, E, B>;
  readonly productR_: <S, R, E, A, B>(
    fa: Kind<F, C, S, R, E, A>,
    fb: Kind<F, C, S, R, E, B>,
  ) => Kind<F, C, S, R, E, B>;
}

export type ApplyRequirements<F, C = Auto> = Pick<Apply<F, C>, 'ap_'> &
  FunctorRequirements<F, C> &
  Partial<Apply<F, C>>;
export const Apply = Object.freeze({
  of: <F, C = Auto>(F: ApplyRequirements<F, C>): Apply<F, C> => {
    const self: Apply<F, C> = {
      ap: fa => ff => self.ap_(ff, fa),

      product: fb => fa => self.product_(fa, fb),
      product_: <S, R, E, A, B>(
        fa: Kind<F, C, S, R, E, A>,
        fb: Kind<F, C, S, R, E, B>,
      ) =>
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

      ...Functor.of<F, C>(F),
      ...F,
    };

    return self;
  },
});
