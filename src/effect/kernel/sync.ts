import { Defer, MonadError } from '../../cats';
import { Kind, Auto, URIS } from '../../core';

export interface Sync<F extends URIS, C = Auto>
  extends MonadError<F, Error, C>,
    Defer<F, C> {
  readonly delay: <S, R, A>(a: () => A) => Kind<F, C, S, R, Error, A>;
}
