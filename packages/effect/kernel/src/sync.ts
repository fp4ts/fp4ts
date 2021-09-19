import { Kind, AnyK } from '@cats4ts/core';
import { Defer, MonadError } from '@cats4ts/cats-core';

export interface Sync<F extends AnyK> extends MonadError<F, Error>, Defer<F> {
  readonly delay: <A>(a: () => A) => Kind<F, [A]>;
}
