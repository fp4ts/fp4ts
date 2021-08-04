import { IO } from './io';
import { Outcome } from './outcome';

export interface Fiber<A> {
  readonly join: IO<Outcome<A>>;
  readonly cancel: IO<void>;
}

export const join: <A>(fa: Fiber<A>) => IO<Outcome<A>> = fa => fa.join;
export const cancel: (fa: Fiber<unknown>) => IO<void> = fa => fa.cancel;
