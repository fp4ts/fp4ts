import { Kind, instance, AnyK } from '@cats4ts/core';
import { Monoid } from './monoid';
import { UnorderedFoldable } from './unordered-foldable';

export interface Foldable<F extends AnyK> extends UnorderedFoldable<F> {
  readonly foldLeft: <A, B>(
    b: B,
    f: (b: B, a: A) => B,
  ) => (fa: Kind<F, [A]>) => B;
  readonly foldLeft_: <A, B>(fa: Kind<F, [A]>, b: B, f: (b: B, a: A) => B) => B;

  readonly foldRight: <A, B>(
    b: B,
    f: (a: A, b: B) => B,
  ) => (fa: Kind<F, [A]>) => B;
  readonly foldRight_: <A, B>(
    fa: Kind<F, [A]>,
    b: B,
    f: (a: A, b: B) => B,
  ) => B;

  readonly foldMap: <M>(
    M: Monoid<M>,
  ) => <A>(f: (a: A) => M) => (fa: Kind<F, [A]>) => M;
  readonly foldMap_: <M>(
    M: Monoid<M>,
  ) => <A>(fa: Kind<F, [A]>, f: (a: A) => M) => M;
}

export type FoldableRequirements<F extends AnyK> = Pick<
  Foldable<F>,
  'foldLeft_' | 'foldRight_'
> &
  Partial<Foldable<F>> &
  Partial<UnorderedFoldable<F>>;
export const Foldable = Object.freeze({
  of: <F extends AnyK>(F: FoldableRequirements<F>): Foldable<F> => {
    const self: Foldable<F> = instance<Foldable<F>>({
      foldLeft: (z, f) => fa => self.foldLeft_(fa, z, f),
      foldRight: (z, f) => fa => self.foldRight_(fa, z, f),

      foldMap: M => f => fa => self.foldMap_(M)(fa, f),
      foldMap_: M => (fa, f) =>
        self.foldLeft_(fa, M.empty, (r, x) => M.combine_(r, () => f(x))),

      ...UnorderedFoldable.of({
        unorderedFoldMap_: F.unorderedFoldMap_ ?? (M => self.foldMap_(M)),
        ...F,
      }),
      ...F,
    });
    return self;
  },
});
