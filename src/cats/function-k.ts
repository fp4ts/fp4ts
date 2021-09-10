import { Auto, Kind } from '../core';

export interface FunctionK<F, G, FC = Auto, GC = Auto> {
  <S, R, E, A>(fa: Kind<F, FC, S, R, E, A>): Kind<G, GC, S, R, E, A>;
}
