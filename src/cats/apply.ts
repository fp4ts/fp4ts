import { Auto, Intro, Kind, Mix, URIS, V } from '../core';
import { Functor, FunctorRequirements } from './functor';

export interface Apply<F extends URIS, C = Auto> extends Functor<F, C> {
  readonly ap: <S2, R2, E2, A>(
    fa: Kind<F, C, S2, R2, E2, A>,
  ) => <S, R, E, B>(
    ff: Kind<
      F,
      C,
      Intro<C, 'S', S2, S>,
      Intro<C, 'R', R2, R>,
      Intro<C, 'E', E2, E>,
      (a: A) => B
    >,
  ) => Kind<
    F,
    C,
    Mix<C, 'S', [S2, S]>,
    Mix<C, 'R', [R2, R]>,
    Mix<C, 'E', [E2, E]>,
    B
  >;

  readonly ap_: <S, R, E, A, B>(
    ff: Kind<F, C, S, R, E, (a: A) => B>,
    fa: Kind<F, C, S, R, E, A>,
  ) => Kind<F, C, S, R, E, B>;

  readonly map2: <S2, R2, E2, A, B, D>(
    fb: Kind<F, C, S2, R2, E2, B>,
    f: (a: A, b: B) => D,
  ) => <S, R, E>(
    fa: Kind<
      F,
      C,
      Intro<C, 'S', S2, S>,
      Intro<C, 'R', R2, R>,
      Intro<C, 'E', E2, E>,
      A
    >,
  ) => Kind<
    F,
    C,
    Mix<C, 'S', [S2, S]>,
    Mix<C, 'R', [R2, R]>,
    Mix<C, 'E', [E2, E]>,
    D
  >;
  readonly map2_: <S, R, E, A, B>(
    fa: Kind<F, C, S, R, E, A>,
    fb: Kind<F, C, S, R, E, B>,
  ) => <D>(f: (a: A, b: B) => D) => Kind<F, C, S, R, E, D>;

  readonly product: <S2, R2, E2, B>(
    fb: Kind<F, C, S2, R2, E2, B>,
  ) => <S, R, E, A>(
    fa: Kind<
      F,
      C,
      Intro<C, 'S', S2, S>,
      Intro<C, 'R', R2, R>,
      Intro<C, 'E', E2, E>,
      A
    >,
  ) => Kind<
    F,
    C,
    Mix<C, 'S', [S2, S]>,
    Mix<C, 'R', [R2, R]>,
    Mix<C, 'E', [E2, E]>,
    [A, B]
  >;
  readonly product_: <S, R, E, A, B>(
    fa: Kind<F, C, S, R, E, A>,
    fb: Kind<F, C, S, R, E, B>,
  ) => Kind<F, C, S, R, E, [A, B]>;

  readonly productL: <S2, R2, E2, B>(
    fb: Kind<F, C, S2, R2, E2, B>,
  ) => <S, R, E, A>(
    fa: Kind<
      F,
      C,
      Intro<C, 'S', S2, S>,
      Intro<C, 'R', R2, R>,
      Intro<C, 'E', E2, E>,
      A
    >,
  ) => Kind<
    F,
    C,
    Mix<C, 'S', [S2, S]>,
    Mix<C, 'R', [R2, R]>,
    Mix<C, 'E', [E2, E]>,
    A
  >;
  readonly productL_: <S, R, E, A, B>(
    fa: Kind<F, C, S, R, E, A>,
    fb: Kind<F, C, S, R, E, B>,
  ) => Kind<F, C, S, R, E, A>;

  readonly productR: <S2, R2, E2, B>(
    fb: Kind<F, C, S2, R2, E2, B>,
  ) => <S, R, E, A>(
    fa: Kind<
      F,
      C,
      Intro<C, 'S', S2, S>,
      Intro<C, 'R', R2, R>,
      Intro<C, 'E', E2, E>,
      A
    >,
  ) => Kind<
    F,
    C,
    Mix<C, 'S', [S2, S]>,
    Mix<C, 'R', [R2, R]>,
    Mix<C, 'E', [E2, E]>,
    B
  >;
  readonly productR_: <S, R, E, A, B>(
    fa: Kind<F, C, S, R, E, A>,
    fb: Kind<F, C, S, R, E, B>,
  ) => Kind<F, C, S, R, E, B>;
}

export type ApplyRequirements<F extends URIS, C = Auto> = Pick<
  Apply<F, C>,
  'ap_'
> &
  FunctorRequirements<F, C> &
  Partial<Apply<F, C>>;
export const Apply = Object.freeze({
  of: <F extends URIS, C = Auto>(F: ApplyRequirements<F, C>): Apply<F, C> => {
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
