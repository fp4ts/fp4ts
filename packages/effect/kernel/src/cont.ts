import { AnyK, Kind } from '@cats4ts/core';
import { FunctionK, Either } from '@cats4ts/cats';
import { MonadCancel } from './monad-cancel';

export interface Cont<F extends AnyK, K, R> {
  <G extends AnyK>(G: MonadCancel<G, Error>): (
    k: (ea: Either<Error, K>) => void,
    get: Kind<G, [K]>,
    nt: FunctionK<F, G>,
  ) => Kind<G, [R]>;
}
