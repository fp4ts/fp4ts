import { Kind } from '../fp/hkt';
import { Applicative } from './applicative';
import { FlatMap } from './flat-map';
import { Foldable } from './foldable';
import { Functor } from './functor';

export interface Traversable<F> extends Functor<F>, Foldable<F> {
  readonly traverse: <G>(
    G: Applicative<G>,
  ) => <A, B>(
    f: (a: A) => Kind<G, B>,
  ) => (fa: Kind<F, A>) => Kind<G, Kind<F, B>>;

  readonly flatTraverse: <G>(
    F: FlatMap<F>,
    G: Applicative<G>,
  ) => <A, B>(
    f: (a: A) => Kind<G, Kind<F, B>>,
  ) => (fa: Kind<F, A>) => Kind<G, Kind<F, B>>;

  readonly sequence: <G>(
    G: Applicative<G>,
  ) => <A>(fga: Kind<F, Kind<G, A>>) => Kind<G, Kind<F, A>>;

  readonly flatSequence: <G>(
    F: FlatMap<F>,
    G: Applicative<G>,
  ) => <A>(fga: Kind<F, Kind<G, Kind<F, A>>>) => Kind<G, Kind<F, A>>;
}
