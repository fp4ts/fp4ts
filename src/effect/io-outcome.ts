import { URI } from './io';
import { Outcome } from './kernel/outcome';

export type IOOutcome<A> = Outcome<URI, Error, A>;
