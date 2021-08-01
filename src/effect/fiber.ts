import { IO } from './io';

export interface Fiber<A> {
  join(): IO<A>;
}
