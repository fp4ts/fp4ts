import { $, AnyK, instance, Kind, α, λ } from '@cats4ts/core';
import { SemigroupK } from '../semigroup-k';
import { Semigroup } from '../semigroup';

export interface Compose<F extends AnyK> {
  readonly compose: <A, B>(
    g: Kind<F, [A, B]>,
  ) => <C>(f: Kind<F, [B, C]>) => Kind<F, [A, C]>;
  readonly compose_: <A, B, C>(
    f: Kind<F, [B, C]>,
    g: Kind<F, [A, B]>,
  ) => Kind<F, [A, C]>;

  readonly andThen: <B, C>(
    g: Kind<F, [B, C]>,
  ) => <A>(f: Kind<F, [A, B]>) => Kind<F, [A, B]>;
  readonly andThen_: <A, B, C>(
    f: Kind<F, [A, B]>,
    g: Kind<F, [B, C]>,
  ) => Kind<F, [A, B]>;

  readonly algebraK: () => SemigroupK<λ<[α], $<F, [α, α]>>>;
  readonly algebra: <A>() => Semigroup<Kind<F, [A, A]>>;
}

export type ComposeRequirements<F extends AnyK> = Pick<Compose<F>, 'compose_'> &
  Partial<Compose<F>>;
export const Compose = Object.freeze({
  of: <F extends AnyK>(F: ComposeRequirements<F>): Compose<F> => {
    const self: Compose<F> = instance<Compose<F>>({
      compose: g => f => self.compose_(f, g),

      andThen: g => f => self.andThen_(f, g),
      andThen_: (f, g) => self.compose_(g, f),

      algebraK: () =>
        SemigroupK.of({
          combineK_: <A>(fx: Kind<F, [A, A]>, fy: () => Kind<F, [A, A]>) =>
            self.compose_(fx, fy()),
        }),

      algebra: () =>
        Semigroup.of({
          combine_: (fx, fy) => self.compose_(fx, fy()),
        }),

      ...F,
    });
    return self;
  },
});
