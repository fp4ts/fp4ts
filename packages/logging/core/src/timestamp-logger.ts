// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Monad } from '@fp4ts/cats';
import { Clock } from '@fp4ts/effect';
import { Logger } from '@fp4ts/logging-kernel';

export function TimestampLogger<F, A>(
  F: Monad<F>,
  C: Clock<F>,
): (logger: Logger<F, A>) => Logger<F, A> {
  return logger =>
    logger.contramapMessageF(F)(msg =>
      F.map_(C.realTime, t => msg.withTimestamp(new Date(t))),
    );
}
