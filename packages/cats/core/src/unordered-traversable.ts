import { AnyK, id, Kind } from '@cats4ts/core';
import { Applicative } from './applicative';
import {
  UnorderedFoldable,
  UnorderedFoldableRequirements,
} from './unordered-foldable';

export interface UnorderedTraversable<T extends AnyK>
  extends UnorderedFoldable<T> {
  readonly unorderedTraverse: <G extends AnyK>(
    G: Applicative<G>,
  ) => <A, B>(
    f: (a: A) => Kind<G, [B]>,
  ) => (fa: Kind<T, [A]>) => Kind<G, [Kind<T, [B]>]>;
  readonly unorderedTraverse_: <G extends AnyK>(
    G: Applicative<G>,
  ) => <A, B>(
    fa: Kind<T, [A]>,
    f: (a: A) => Kind<G, [B]>,
  ) => Kind<G, [Kind<T, [B]>]>;

  readonly unorderedSequence: <G extends AnyK>(
    G: Applicative<G>,
  ) => <A>(fga: Kind<T, [Kind<G, [A]>]>) => Kind<G, [Kind<T, [A]>]>;
}

export type UnorderedTraversableRequirements<T extends AnyK> = Pick<
  UnorderedTraversable<T>,
  'unorderedTraverse_'
> &
  UnorderedFoldableRequirements<T> &
  Partial<UnorderedTraversable<T>>;

export const UnorderedTraversable = Object.freeze({
  of: <T extends AnyK>(
    T: UnorderedTraversableRequirements<T>,
  ): UnorderedTraversable<T> => {
    const self: UnorderedTraversable<T> = {
      unorderedTraverse: G => f => fa => self.unorderedTraverse_(G)(fa, f),

      unorderedSequence: G => fga => self.unorderedTraverse_(G)(fga, id),

      ...UnorderedFoldable.of(T),
      ...T,
    };
    return self;
  },
});
