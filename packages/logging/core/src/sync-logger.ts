// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Sync } from '@fp4ts/effect';
import { Logger, LogMessage } from '@fp4ts/logging-kernel';

export function SyncLogger<F, A>(
  F: Sync<F>,
  log: (msg: LogMessage<A>) => Kind<F, [void]>,
): Logger<F, A> {
  return new Logger(F, msg =>
    F.flatMap_(F.realTime, t => log(msg.withTimestamp(new Date(t)))),
  );
}
