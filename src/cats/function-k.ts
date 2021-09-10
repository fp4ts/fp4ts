import { Auto, Kind, URIS } from '../core';

export interface FunctionK<
  F extends URIS,
  G extends URIS,
  FC = Auto,
  GC = Auto,
> {
  <S, R, E, A>(fa: Kind<F, FC, S, R, E, A>): Kind<G, GC, S, R, E, A>;
}
