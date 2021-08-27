import { Defer, MonadError } from '../../cats';
import { Kind } from '../../fp/hkt';

export interface Sync<F> extends MonadError<F, Error>, Defer<F> {
  readonly delay: <A>(a: () => A) => Kind<F, A>;
}
