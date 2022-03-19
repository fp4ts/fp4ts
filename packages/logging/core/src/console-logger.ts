// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Applicative } from '@fp4ts/cats';
import { Console } from '@fp4ts/effect';
import { Logger, LogFormat, LogMessage } from '@fp4ts/logging-kernel';

export const ConsoleLogger: ConsoleLoggerObj = function <F, A>(
  F: Applicative<F>,
  C: Console<F>,
  format: LogFormat<A> = LogFormat.default,
) {
  return new Logger(F, (msg: LogMessage<A>) => C.printLn(format(msg)));
};

interface ConsoleLoggerObj {
  <F, A>(F: Applicative<F>, C: Console<F>, format?: LogFormat<A>): Logger<F, A>;
}
