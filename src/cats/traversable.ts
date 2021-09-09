import { FlatMap, FlatMap2C, FlatMap2 } from './flat-map';
import { Kind, Kind2 } from '../fp/hkt';
import { Applicative } from './applicative';
import {
  Foldable,
  Foldable2C,
  Foldable2,
  Foldable2CRequirements,
  Foldable2Requirements,
  FoldableRequirements,
} from './foldable';
import {
  Functor,
  Functor2C,
  Functor2,
  Functor2CRequirements,
  Functor2Requirements,
  FunctorRequirements,
} from './functor';
import { id } from '../fp/core';

export interface Traversable<F> extends Functor<F>, Foldable<F> {
  readonly traverse: <G>(
    G: Applicative<G>,
  ) => <A, B>(
    f: (a: A) => Kind<G, B>,
  ) => (fa: Kind<F, A>) => Kind<G, Kind<F, B>>;
  readonly traverse_: <G>(
    G: Applicative<G>,
  ) => <A, B>(fa: Kind<F, A>, f: (a: A) => Kind<G, B>) => Kind<G, Kind<F, B>>;

  readonly sequence: <G>(
    G: Applicative<G>,
  ) => <A>(fga: Kind<F, Kind<G, A>>) => Kind<G, Kind<F, A>>;

  readonly flatTraverse: <G>(
    F: FlatMap<F>,
    G: Applicative<G>,
  ) => <A, B>(
    f: (a: A) => Kind<G, Kind<F, B>>,
  ) => (fa: Kind<F, A>) => Kind<G, Kind<F, B>>;
  readonly flatTraverse_: <G>(
    F: FlatMap<F>,
    G: Applicative<G>,
  ) => <A, B>(
    fa: Kind<F, A>,
    f: (a: A) => Kind<G, Kind<F, B>>,
  ) => Kind<G, Kind<F, B>>;

  readonly flatSequence: <G>(
    F: FlatMap<F>,
    G: Applicative<G>,
  ) => <A>(fgfa: Kind<F, Kind<G, Kind<F, A>>>) => Kind<G, Kind<F, A>>;
}

export type TraversableRequirements<T> = Pick<Traversable<T>, 'traverse_'> &
  FoldableRequirements<T> &
  FunctorRequirements<T> &
  Partial<Traversable<T>>;

export const Traversable = Object.freeze({
  of: <T>(T: TraversableRequirements<T>): Traversable<T> => {
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

export interface Traversable2C<F, E> extends Functor2C<F, E>, Foldable2C<F, E> {
  readonly traverse: <G>(
    G: Applicative<G>,
  ) => <A, B>(
    f: (a: A) => Kind<G, B>,
  ) => (fa: Kind2<F, E, A>) => Kind<G, Kind2<F, E, B>>;
  readonly traverse_: <G>(
    G: Applicative<G>,
  ) => <A, B>(
    fa: Kind2<F, E, A>,
    f: (a: A) => Kind<G, B>,
  ) => Kind<G, Kind2<F, E, B>>;

  readonly sequence: <G>(
    G: Applicative<G>,
  ) => <A>(fga: Kind2<F, E, Kind<G, A>>) => Kind<G, Kind2<F, E, A>>;

  readonly flatTraverse: <G>(
    F: FlatMap2C<F, E>,
    G: Applicative<G>,
  ) => <A, B>(
    f: (a: A) => Kind<G, Kind2<F, E, B>>,
  ) => (fa: Kind2<F, E, A>) => Kind<G, Kind2<F, E, B>>;
  readonly flatTraverse_: <G>(
    F: FlatMap2C<F, E>,
    G: Applicative<G>,
  ) => <A, B>(
    fa: Kind2<F, E, A>,
    f: (a: A) => Kind<G, Kind2<F, E, B>>,
  ) => Kind<G, Kind2<F, E, B>>;

  readonly flatSequence: <G>(
    F: FlatMap2C<F, E>,
    G: Applicative<G>,
  ) => <A>(
    fga: Kind2<F, E, Kind<G, Kind2<F, E, A>>>,
  ) => Kind<G, Kind2<F, E, A>>;
}

export type Traversable2CRequirements<T, E> = Pick<
  Traversable2C<T, E>,
  'traverse_'
> &
  Foldable2CRequirements<T, E> &
  Functor2CRequirements<T, E> &
  Partial<Traversable2C<T, E>>;

export const Traversable2C = Object.freeze({
  of: <T, E>(T: Traversable2CRequirements<T, E>): Traversable2C<T, E> => {
    const self: Traversable2C<T, E> = {
      traverse: G => f => fa => self.traverse_(G)(fa, f),

      sequence: G => fga => self.traverse_(G)(fga, id),

      flatTraverse: (F, G) => f => fa => self.flatTraverse_(F, G)(fa, f),
      flatTraverse_: (F, G) => (fa, f) =>
        G.map_(self.traverse_(G)(fa, f), F.flatten),

      flatSequence: (F, G) => fgfa => self.flatTraverse_(F, G)(fgfa, id),

      ...Foldable2C.of<T, E>(T),
      ...Functor2C.of<T, E>(T),
      ...T,
    };
    return self;
  },
});

export interface Traversable2<F> extends Functor2<F>, Foldable2<F> {
  readonly traverse: <G>(
    G: Applicative<G>,
  ) => <A, B>(
    f: (a: A) => Kind<G, B>,
  ) => <E>(fa: Kind2<F, E, A>) => Kind<G, Kind2<F, E, B>>;
  readonly traverse_: <G>(
    G: Applicative<G>,
  ) => <E, A, B>(
    fa: Kind2<F, E, A>,
    f: (a: A) => Kind<G, B>,
  ) => Kind<G, Kind2<F, E, B>>;

  readonly sequence: <G>(
    G: Applicative<G>,
  ) => <E, A>(fga: Kind2<F, E, Kind<G, A>>) => Kind<G, Kind2<F, E, A>>;

  readonly flatTraverse: <G>(
    F: FlatMap2<F>,
    G: Applicative<G>,
  ) => <E, A, B>(
    f: (a: A) => Kind<G, Kind2<F, E, B>>,
  ) => (fa: Kind2<F, E, A>) => Kind<G, Kind2<F, E, B>>;
  readonly flatTraverse_: <G>(
    F: FlatMap2<F>,
    G: Applicative<G>,
  ) => <E, A, B>(
    fa: Kind2<F, E, A>,
    f: (a: A) => Kind<G, Kind2<F, E, B>>,
  ) => Kind<G, Kind2<F, E, B>>;

  readonly flatSequence: <G>(
    F: FlatMap2<F>,
    G: Applicative<G>,
  ) => <E, A>(
    fga: Kind2<F, E, Kind<G, Kind2<F, E, A>>>,
  ) => Kind<G, Kind2<F, E, A>>;
}

export type Traversable2Requirements<T> = Pick<Traversable2<T>, 'traverse_'> &
  Foldable2Requirements<T> &
  Functor2Requirements<T> &
  Partial<Traversable2<T>>;

export const Traversable2 = Object.freeze({
  of: <T>(T: Traversable2Requirements<T>): Traversable2<T> => {
    const self: Traversable2<T> = {
      traverse: G => f => fa => self.traverse_(G)(fa, f),

      sequence: G => fga => self.traverse_(G)(fga, id),

      flatTraverse: (F, G) => f => fa => self.flatTraverse_(F, G)(fa, f),
      flatTraverse_: (F, G) => (fa, f) =>
        G.map_(self.traverse_(G)(fa, f), F.flatten),

      flatSequence: (F, G) => fgfa => self.flatTraverse_(F, G)(fgfa, id),

      ...Foldable2.of<T>(T),
      ...Functor2.of<T>(T),
      ...T,
    };
    return self;
  },
});
