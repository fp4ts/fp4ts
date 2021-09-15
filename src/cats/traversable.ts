import { Kind, id, AnyK } from '../core';
import { FlatMap } from './flat-map';
import { Applicative } from './applicative';
import { Foldable, FoldableRequirements } from './foldable';
import { Functor, FunctorRequirements } from './functor';

export interface Traversable<F extends AnyK> extends Functor<F>, Foldable<F> {
  readonly traverse: <G extends AnyK>(
    G: Applicative<G>,
  ) => <A, B>(
    f: (a: A) => Kind<G, [B]>,
  ) => <S, R, E>(fa: Kind<F, [A]>) => Kind<G, [Kind<F, [B]>]>;
  readonly traverse_: <G extends AnyK>(
    G: Applicative<G>,
  ) => <A, B>(
    fa: Kind<F, [A]>,
    f: (a: A) => Kind<G, [B]>,
  ) => Kind<G, [Kind<F, [B]>]>;

  readonly sequence: <G extends AnyK>(
    G: Applicative<G>,
  ) => <CG, A>(fga: Kind<F, [Kind<G, [A]>]>) => Kind<G, [Kind<F, [A]>]>;

  readonly flatTraverse: <G extends AnyK>(
    F: FlatMap<F>,
    G: Applicative<G>,
  ) => <A, B>(
    f: (a: A) => Kind<G, [Kind<F, [B]>]>,
  ) => <S, R, E>(fa: Kind<F, [A]>) => Kind<G, [Kind<F, [B]>]>;
  readonly flatTraverse_: <G extends AnyK>(
    F: FlatMap<F>,
    G: Applicative<G>,
  ) => <A, B>(
    fa: Kind<F, [A]>,
    f: (a: A) => Kind<G, [Kind<F, [B]>]>,
  ) => Kind<G, [Kind<F, [B]>]>;

  readonly flatSequence: <G extends AnyK>(
    F: FlatMap<F>,
    G: Applicative<G>,
  ) => <A>(fgfa: Kind<F, [Kind<G, [Kind<F, [A]>]>]>) => Kind<G, [Kind<F, [A]>]>;
}

export type TraversableRequirements<T extends AnyK> = Pick<
  Traversable<T>,
  'traverse_'
> &
  FoldableRequirements<T> &
  FunctorRequirements<T> &
  Partial<Traversable<T>>;

export const Traversable = Object.freeze({
  of: <T extends AnyK>(T: TraversableRequirements<T>): Traversable<T> => {
    const self: Traversable<T> = {
      traverse: G => f => fa => self.traverse_(G)(fa, f),

      sequence: G => fga => self.traverse_(G)(fga, id),

      flatTraverse: (F, G) => f => fa => self.flatTraverse_(F, G)(fa, f),
      flatTraverse_: (F, G) => (fa, f) =>
        G.map_(self.traverse_(G)(fa, f), F.flatten),

      flatSequence: (F, G) => fgfa => self.flatTraverse_(F, G)(fgfa, id),

      ...Foldable.of(T),
      ...Functor.of(T),
      ...T,
    };
    return self;
  },
});
