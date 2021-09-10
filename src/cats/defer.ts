import { Auto, Base, Kind, URIS } from '../core';

export interface Defer<F extends URIS, C = Auto> extends Base<F, C> {
  readonly defer: <S, R, E, A>(
    fa: () => Kind<F, C, S, R, E, A>,
  ) => Kind<F, C, S, R, E, A>;
}
