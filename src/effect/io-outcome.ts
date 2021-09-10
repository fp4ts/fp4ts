import { URI } from '../core';
import { IoURI } from './io';
import { Outcome } from './kernel/outcome';

export type IOOutcome<A> = Outcome<[URI<IoURI>], Error, A>;
