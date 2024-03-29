// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Outcome } from '@fp4ts/effect-kernel';
import { IO, IOF } from './io';

export type IOOutcome<A> = Outcome<IOF, Error, A>;

export const IOOutcome = {
  success: <A>(fa: IO<A>): IOOutcome<A> => Outcome.success(fa),
  failure: (e: Error): IOOutcome<never> => Outcome.failure(e),
  canceled: (): IOOutcome<never> => Outcome.canceled(),
};
