// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Async, Console } from '@fp4ts/effect';
import { Logger, LogFormat, LogMessage } from '@fp4ts/logging-kernel';
import { SyncLogger } from './sync-logger';

export const ConsoleLogger: ConsoleLoggerObj = function <F, A>(
  F: Async<F>,
  format: LogFormat<A> = LogFormat.default,
) {
  const C = Console.make(F);
  return SyncLogger(F, (msg: LogMessage<A>) => C.printLn(format(msg)));
};

interface ConsoleLoggerObj {
  <F, A>(F: Async<F>, format?: LogFormat<A>): Logger<F, A>;
}
