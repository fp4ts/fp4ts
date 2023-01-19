// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Applicative } from '@fp4ts/cats';
import { Console } from '@fp4ts/effect';
import { Logger, LogMessage } from '@fp4ts/logging-kernel';

export const ConsoleLogger: ConsoleLoggerObj = function <F>(
  F: Applicative<F>,
  C: Console<F>,
) {
  return new Logger(F, (msg: LogMessage<string>) => C.printLn(msg.message));
};

interface ConsoleLoggerObj {
  <F>(F: Applicative<F>, C: Console<F>): Logger<F, string>;
}
