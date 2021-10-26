import { id, Kind } from '@fp4ts/core';
import { Category } from './category';
import { Strong } from './strong';

/**
 * @category Type Class
 */
export interface Arrow<F> extends Category<F>, Strong<F> {
  readonly lift: <A, B>(f: (a: A) => B) => Kind<F, [A, B]>;

  readonly split: <C, D>(
    g: Kind<F, [C, D]>,
  ) => <A, B>(f: Kind<F, [A, B]>) => Kind<F, [[A, C], [B, D]]>;
  readonly split_: <A, B, C, D>(
    f: Kind<F, [A, B]>,
    g: Kind<F, [C, D]>,
  ) => Kind<F, [[A, C], [B, D]]>;

  readonly merge: <A, C>(
    g: Kind<F, [A, C]>,
  ) => <B>(f: Kind<F, [A, B]>) => Kind<F, [A, [B, C]]>;
  readonly merge_: <A, B, C>(
    f: Kind<F, [A, B]>,
    g: Kind<F, [A, C]>,
  ) => Kind<F, [A, [B, C]]>;
}

export type ArrowRequirements<F> = Pick<
  Arrow<F>,
  'lift' | 'first' | 'compose_'
> &
  Partial<Arrow<F>>;
export const Arrow = Object.freeze({
  of: <F>(F: ArrowRequirements<F>): Arrow<F> => {
    const self: Arrow<F> = {
      split: g => f => self.split_(f, g),
      split_: (f, g) => self.andThen_(self.first(f), self.second(g)),

      merge: g => f => self.merge_(f, g),
      merge_: <A, B, C>(f: Kind<F, [A, B]>, g: Kind<F, [A, C]>) =>
        self.andThen_(
          self.lift((x: A) => [x, x]),
          self.split_(f, g),
        ),

      ...Category.of({ id: F.id ?? (() => self.lift(id)), ...F }),
      ...Strong.of({
        dimap_:
          F.dimap_ ??
          ((fab, f, g) =>
            self.compose_(self.lift(g), self.andThen_(self.lift(f), fab))),
        second:
          F.second ??
          (<A, B, C>(fab: Kind<F, [A, B]>) => {
            const swap = <X, Y>(): Kind<F, [[X, Y], [Y, X]]> =>
              self.lift(([x, y]: [X, Y]) => [y, x] as [Y, X]);

            return self.compose_(
              swap(),
              self.compose_(self.first<A, B, C>(fab), swap()),
            );
          }),
        ...F,
      }),
      ...F,
    };
    return self;
  },
});
