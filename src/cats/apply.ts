import { Kind, Kind2 } from '../fp/hkt';
import {
  Functor,
  Functor2C,
  Functor2,
  FunctorRequirements,
  Functor2CRequirements,
  Functor2Requirements,
} from './functor';

export interface Apply<F> extends Functor<F> {
  readonly ap: <A>(
    fa: Kind<F, A>,
  ) => <B>(ff: Kind<F, (a: A) => B>) => Kind<F, B>;
  readonly ap_: <A, B>(ff: Kind<F, (a: A) => B>, fa: Kind<F, A>) => Kind<F, B>;

  readonly map2: <A, B, C>(
    fb: Kind<F, B>,
    f: (a: A, b: B) => C,
  ) => (fa: Kind<F, A>) => Kind<F, C>;
  readonly map2_: <A, B>(
    fa: Kind<F, A>,
    fb: Kind<F, B>,
  ) => <C>(f: (a: A, b: B) => C) => Kind<F, C>;

  readonly product: <B>(
    fb: Kind<F, B>,
  ) => <A>(fa: Kind<F, A>) => Kind<F, [A, B]>;
  readonly product_: <A, B>(fa: Kind<F, A>, fb: Kind<F, B>) => Kind<F, [A, B]>;

  readonly productL: <B>(fb: Kind<F, B>) => <A>(fa: Kind<F, A>) => Kind<F, A>;
  readonly productL_: <A, B>(fa: Kind<F, A>, fb: Kind<F, B>) => Kind<F, A>;

  readonly productR: <B>(fb: Kind<F, B>) => <A>(fa: Kind<F, A>) => Kind<F, B>;
  readonly productR_: <A, B>(fa: Kind<F, A>, fb: Kind<F, B>) => Kind<F, B>;
}

export type ApplyRequirements<F> = Pick<Apply<F>, 'ap_'> &
  FunctorRequirements<F> &
  Partial<Apply<F>>;
export const Apply = Object.freeze({
  of: <F>(F: ApplyRequirements<F>): Apply<F> => {
    const self: Apply<F> = {
      ...Functor.of(F),

      ap: fa => ff => self.ap_(ff, fa),

      product: fb => fa => self.product_(fa, fb),
      product_: <A, B>(fa: Kind<F, A>, fb: Kind<F, B>) =>
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

      ...F,
    };

    return self;
  },
});

export interface Apply2C<F, E> extends Functor2C<F, E> {
  readonly ap: <A>(
    fa: Kind2<F, E, A>,
  ) => <B>(ff: Kind2<F, E, (a: A) => B>) => Kind2<F, E, B>;
  readonly ap_: <A, B>(
    ff: Kind2<F, E, (a: A) => B>,
    fa: Kind2<F, E, A>,
  ) => Kind2<F, E, B>;

  readonly map2: <A, B, C>(
    fb: Kind2<F, E, B>,
    f: (a: A, b: B) => C,
  ) => (fa: Kind2<F, E, A>) => Kind2<F, E, C>;
  readonly map2_: <A, B>(
    fa: Kind2<F, E, A>,
    fb: Kind2<F, E, B>,
  ) => <C>(f: (a: A, b: B) => C) => Kind2<F, E, C>;

  readonly product: <B>(
    fb: Kind2<F, E, B>,
  ) => <A>(fa: Kind2<F, E, A>) => Kind2<F, E, [A, B]>;
  readonly product_: <A, B>(
    fa: Kind2<F, E, A>,
    fb: Kind2<F, E, B>,
  ) => Kind2<F, E, [A, B]>;

  readonly productL: <B>(
    fb: Kind2<F, E, B>,
  ) => <A>(fa: Kind2<F, E, A>) => Kind2<F, E, A>;
  readonly productL_: <A, B>(
    fa: Kind2<F, E, A>,
    fb: Kind2<F, E, B>,
  ) => Kind2<F, E, A>;

  readonly productR: <B>(
    fb: Kind2<F, E, B>,
  ) => <A>(fa: Kind2<F, E, A>) => Kind2<F, E, B>;
  readonly productR_: <A, B>(
    fa: Kind2<F, E, A>,
    fb: Kind2<F, E, B>,
  ) => Kind2<F, E, B>;
}

export type Apply2CRequirements<F, E> = Pick<Apply2C<F, E>, 'ap_'> &
  Functor2CRequirements<F, E> &
  Partial<Apply2C<F, E>>;
export const Apply2C = Object.freeze({
  of: <F, E>(F: Apply2CRequirements<F, E>): Apply2C<F, E> => {
    const self: Apply2C<F, E> = {
      ap: fa => ff => self.ap_(ff, fa),

      product: fb => fa => self.product_(fa, fb),
      product_: <A, B>(fa: Kind2<F, E, A>, fb: Kind2<F, E, B>) =>
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

      ...Functor2C.of(F),
      ...F,
    };

    return self;
  },
});

export interface Apply2<F> extends Functor2<F> {
  readonly ap: <A, E>(
    fa: Kind2<F, E, A>,
  ) => <B>(ff: Kind2<F, E, (a: A) => B>) => Kind2<F, E, B>;
  readonly ap_: <E, A, B>(
    ff: Kind2<F, E, (a: A) => B>,
    fa: Kind2<F, E, A>,
  ) => Kind2<F, E, B>;

  readonly map2: <E, A, B, C>(
    fb: Kind2<F, E, B>,
    f: (a: A, b: B) => C,
  ) => (fa: Kind2<F, E, A>) => Kind2<F, E, C>;
  readonly map2_: <E, A, B>(
    fa: Kind2<F, E, A>,
    fb: Kind2<F, E, B>,
  ) => <C>(f: (a: A, b: B) => C) => Kind2<F, E, C>;

  readonly product: <E, B>(
    fb: Kind2<F, E, B>,
  ) => <A>(fa: Kind2<F, E, A>) => Kind2<F, E, [A, B]>;
  readonly product_: <E, A, B>(
    fa: Kind2<F, E, A>,
    fb: Kind2<F, E, B>,
  ) => Kind2<F, E, [A, B]>;

  readonly productL: <E, B>(
    fb: Kind2<F, E, B>,
  ) => <A>(fa: Kind2<F, E, A>) => Kind2<F, E, A>;
  readonly productL_: <E, A, B>(
    fa: Kind2<F, E, A>,
    fb: Kind2<F, E, B>,
  ) => Kind2<F, E, A>;

  readonly productR: <E, B>(
    fb: Kind2<F, E, B>,
  ) => <A>(fa: Kind2<F, E, A>) => Kind2<F, E, B>;
  readonly productR_: <E, A, B>(
    fa: Kind2<F, E, A>,
    fb: Kind2<F, E, B>,
  ) => Kind2<F, E, B>;
}

export type Apply2Requirements<F> = Pick<Apply2<F>, 'ap_'> &
  Functor2Requirements<F> &
  Partial<Apply2<F>>;
export const Apply2 = Object.freeze({
  of: <F>(F: Apply2Requirements<F>): Apply2<F> => {
    const self: Apply2<F> = {
      ap: fa => ff => self.ap_(ff, fa),

      product: fb => fa => self.product_(fa, fb),
      product_: <E, A, B>(fa: Kind2<F, E, A>, fb: Kind2<F, E, B>) =>
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

      ...Functor2.of(F),
      ...F,
    };

    return self;
  },
});
