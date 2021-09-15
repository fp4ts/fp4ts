import { Kind, AnyK } from '../../core';
import { Defer, MonadError } from '../../cats';

export interface Sync<F extends AnyK> extends MonadError<F, Error>, Defer<F> {
  readonly delay: <A>(a: () => A) => Kind<F, [A]>;
}
