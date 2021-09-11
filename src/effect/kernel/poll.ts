import { Auto, Kind, URIS } from '../../core';

export interface Poll<F extends URIS, C = Auto> {
  <S, R, E, A>(ioa: Kind<F, C, S, R, E, A>): Kind<F, C, S, R, E, A>;
}
