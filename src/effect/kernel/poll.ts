import { Auto, Base, Kind } from '../../core';

export interface Poll<F, C = Auto> {
  <S, R, E, A>(ioa: Kind<F, C, S, R, E, A>): Kind<F, C, S, R, E, A>;
}
