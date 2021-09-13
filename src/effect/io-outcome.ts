import { URI } from '../core';
import { IO, IoURI } from './io';
import { Outcome } from './kernel/outcome';

export type IOOutcome<A> = Outcome<[URI<IoURI>], Error, A>;

export const IOOutcome = {
  success: <A>(fa: IO<A>): IOOutcome<A> => Outcome.success(fa),
  failure: (e: Error): IOOutcome<never> => Outcome.failure(e),
  canceled: (): IOOutcome<never> => Outcome.canceled(),
};
