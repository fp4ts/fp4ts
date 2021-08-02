import { IO } from './io';
import { Outcome } from './outcome';

export interface Fiber<A> {
  readonly join: IO<Outcome<A>>;
  readonly cancel: IO<void>;
}
