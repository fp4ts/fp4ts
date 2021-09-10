import { Kind, id, Auto } from '../core';
import { FlatMap } from './flat-map';
import { Applicative } from './applicative';
import { Foldable, FoldableRequirements } from './foldable';
import { Functor, FunctorRequirements } from './functor';

export interface Traversable<F, C = Auto>
  extends Functor<F, C>,
    Foldable<F, C> {
  readonly traverse: <G>(
    G: Applicative<G>,
  ) => <S, R, E, A, B>(
    f: (a: A) => Kind<G, C, S, R, E, B>,
  ) => (
    fa: Kind<F, C, S, R, E, A>,
  ) => Kind<G, C, S, R, E, Kind<F, C, S, R, E, B>>;
  readonly traverse_: <G>(
    G: Applicative<G>,
  ) => <S, R, E, A, B>(
    fa: Kind<F, C, S, R, E, A>,
    f: (a: A) => Kind<G, C, S, R, E, B>,
  ) => Kind<G, C, S, R, E, Kind<F, C, S, R, E, B>>;

  readonly sequence: <G>(
    G: Applicative<G>,
  ) => <S, R, E, A>(
    fga: Kind<F, C, S, R, E, Kind<G, C, S, R, E, A>>,
  ) => Kind<G, C, S, R, E, Kind<F, C, S, R, E, A>>;

  readonly flatTraverse: <G>(
    F: FlatMap<F>,
    G: Applicative<G>,
  ) => <S, R, E, A, B>(
    f: (a: A) => Kind<G, C, S, R, E, Kind<F, C, S, R, E, B>>,
  ) => (
    fa: Kind<F, C, S, R, E, A>,
  ) => Kind<G, C, S, R, E, Kind<F, C, S, R, E, B>>;
  readonly flatTraverse_: <G>(
    F: FlatMap<F>,
    G: Applicative<G>,
  ) => <S, R, E, A, B>(
    fa: Kind<F, C, S, R, E, A>,
    f: (a: A) => Kind<G, C, S, R, E, Kind<F, C, S, R, E, B>>,
  ) => Kind<G, C, S, R, E, Kind<F, C, S, R, E, B>>;

  readonly flatSequence: <G>(
    F: FlatMap<F>,
    G: Applicative<G>,
  ) => <S, R, E, A>(
    fgfa: Kind<F, C, S, R, E, Kind<G, C, S, R, E, Kind<F, C, S, R, E, A>>>,
  ) => Kind<G, C, S, R, E, Kind<F, C, S, R, E, A>>;
}

export type TraversableRequirements<T, C = Auto> = Pick<
  Traversable<T, C>,
  'traverse_'
> &
  FoldableRequirements<T, C> &
  FunctorRequirements<T, C> &
  Partial<Traversable<T, C>>;

export const Traversable = Object.freeze({
  of: <T, C = Auto>(T: TraversableRequirements<T, C>): Traversable<T, C> => {
    const self: Traversable<T, C> = {
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
