import { Base, Kind, instance, id } from '@fp4ts/core';

/**
 * @category Type Class
 */
export interface Profunctor<F> extends Base<F> {
  readonly dimap: <A, B, C, D>(
    f: (c: C) => A,
    g: (b: B) => D,
  ) => (fab: Kind<F, [A, B]>) => Kind<F, [C, D]>;
  readonly dimap_: <A, B, C, D>(
    fab: Kind<F, [A, B]>,
    f: (c: C) => A,
    g: (b: B) => D,
  ) => Kind<F, [C, D]>;

  readonly lmap: <A, C>(
    f: (c: C) => A,
  ) => <B>(fab: Kind<F, [A, B]>) => Kind<F, [C, B]>;
  readonly lmap_: <A, B, C>(
    fab: Kind<F, [A, B]>,
    f: (c: C) => A,
  ) => Kind<F, [C, B]>;

  readonly rmap: <B, D>(
    g: (b: B) => D,
  ) => <A>(fab: Kind<F, [A, B]>) => Kind<F, [A, D]>;
  readonly rmap_: <A, B, D>(
    fab: Kind<F, [A, B]>,
    g: (b: B) => D,
  ) => Kind<F, [A, D]>;

  readonly leftNarrow: <A, AA extends A, B>(
    fa: Kind<F, [A, B]>,
  ) => Kind<F, [AA, B]>;
  readonly rightWiden: <A, BB, B extends BB>(
    fa: Kind<F, [A, B]>,
  ) => Kind<F, [A, BB]>;
}

export type ProfunctorRequirements<F> = Pick<Profunctor<F>, 'dimap_'> &
  Partial<Profunctor<F>>;
export const Profunctor = Object.freeze({
  of: <F>(F: ProfunctorRequirements<F>): Profunctor<F> => {
    const self: Profunctor<F> = instance<Profunctor<F>>({
      dimap: (f, g) => fab => F.dimap_(fab, f, g),

      lmap: f => fab => self.lmap_(fab, f),
      lmap_: (fab, f) => F.dimap_(fab, f, id),

      rmap: f => fab => self.rmap_(fab, f),
      rmap_: (fab, g) => F.dimap_(fab, id, g),

      leftNarrow: id,
      rightWiden: id,
      ...F,
    });
    return self;
  },
});
