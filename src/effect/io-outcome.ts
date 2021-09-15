import { IO } from './io';
import { IoK } from './io/io';
import { Outcome } from './kernel/outcome';

export type IOOutcome<A> = Outcome<IoK, Error, A>;

export const IOOutcome = {
  success: <A>(fa: IO<A>): IOOutcome<A> => Outcome.success(fa),
  failure: (e: Error): IOOutcome<never> => Outcome.failure(e),
  canceled: (): IOOutcome<never> => Outcome.canceled(),
};
