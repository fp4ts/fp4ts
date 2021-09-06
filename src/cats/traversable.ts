import { Kind, Kind2 } from '../fp/hkt';
import { Applicative } from './applicative';
import { Foldable, Foldable2C, Foldable2 } from './foldable';
import { Functor, Functor2C, Functor2 } from './functor';

export interface Traversable<F> extends Functor<F>, Foldable<F> {
  readonly traverse: <G>(
    G: Applicative<G>,
  ) => <A, B>(
    f: (a: A) => Kind<G, B>,
  ) => (fa: Kind<F, A>) => Kind<G, Kind<F, B>>;

  readonly sequence: <G>(
    G: Applicative<G>,
  ) => <A>(fga: Kind<F, Kind<G, A>>) => Kind<G, Kind<F, A>>;

  // readonly flatTraverse: <G>(
  //   F: FlatMap<F>,
  //   G: Applicative<G>,
  // ) => <A, B>(
  //   f: (a: A) => Kind<G, Kind<F, B>>,
  // ) => (fa: Kind<F, A>) => Kind<G, Kind<F, B>>;

  // readonly flatSequence: <G>(
  //   F: FlatMap<F>,
  //   G: Applicative<G>,
  // ) => <A>(fga: Kind<F, Kind<G, Kind<F, A>>>) => Kind<G, Kind<F, A>>;
}

export interface Traversable2C<F, E> extends Functor2C<F, E>, Foldable2C<F, E> {
  readonly traverse: <G>(
    G: Applicative<G>,
  ) => <A, B>(
    f: (a: A) => Kind<G, B>,
  ) => (fa: Kind2<F, E, A>) => Kind<G, Kind2<F, E, B>>;

  readonly sequence: <G>(
    G: Applicative<G>,
  ) => <A>(fga: Kind2<F, E, Kind<G, A>>) => Kind<G, Kind2<F, E, A>>;

  // readonly flatTraverse: <G>(
  //   F: FlatMap<F>,
  //   G: Applicative<G>,
  // ) => <A, B>(
  //   f: (a: A) => Kind<G, Kind2<F, E, B>>,
  // ) => (fa: Kind2<F, E, A>) => Kind<G, Kind2<F, E, B>>;

  // readonly flatSequence: <G>(
  //   F: FlatMap2C<F, E>,
  //   G: Applicative<G>,
  // ) => <A>(
  //   fga: Kind2<F, E, Kind<G, Kind2<F, E, A>>>,
  // ) => Kind<G, Kind2<F, E, A>>;
}

export interface Traversable2<F> extends Functor2<F>, Foldable2<F> {
  readonly traverse: <G>(
    G: Applicative<G>,
  ) => <A, B, E>(
    f: (a: A) => Kind<G, B>,
  ) => (fa: Kind2<F, E, A>) => Kind<G, Kind2<F, E, B>>;

  readonly sequence: <G>(
    G: Applicative<G>,
  ) => <A, E>(fga: Kind2<F, E, Kind<G, A>>) => Kind<G, Kind2<F, E, A>>;

  // readonly flatTraverse: <G>(
  //   F: FlatMap<F>,
  //   G: Applicative<G>,
  // ) => <A, B, E>(
  //   f: (a: A) => Kind<G, Kind2<F, E, B>>,
  // ) => (fa: Kind2<F, E, A>) => Kind<G, Kind2<F, E, B>>;

  // readonly flatSequence: <G>(
  //   F: FlatMap2<F>,
  //   G: Applicative<G>,
  // ) => <A, E>(
  //   fga: Kind2<F, E, Kind<G, Kind2<F, E, A>>>,
  // ) => Kind<G, Kind2<F, E, A>>;
}
