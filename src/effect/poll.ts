import { IO } from './io';

export interface Poll {
  <A>(ioa: IO<A>): IO<A>;
}
