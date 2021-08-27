import { Kind } from '../fp/hkt';
import { Apply } from './apply';

export interface FlatMap<F> extends Apply<F> {
  readonly flatMap: <A>(
    fa: Kind<F, A>,
  ) => <B>(f: (a: A) => Kind<F, B>) => Kind<F, B>;

  readonly flatten: <A>(ffa: Kind<F, Kind<F, A>>) => Kind<F, A>;
}
