import { Kind } from '../fp/hkt';
import { Apply } from './apply';

export interface FlatMap<F> extends Apply<F> {
  readonly flatMap: <A, B>(
    f: (a: A) => Kind<F, B>,
  ) => (fa: Kind<F, A>) => Kind<F, B>;

  readonly flatTap: <A>(
    f: (a: A) => Kind<F, unknown>,
  ) => (fa: Kind<F, A>) => Kind<F, A>;

  readonly flatten: <A>(ffa: Kind<F, Kind<F, A>>) => Kind<F, A>;
}
