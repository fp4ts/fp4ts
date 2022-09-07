// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { pipe } from '@fp4ts/core';
import { State } from '@fp4ts/cats-mtl';
import { Clock } from '@fp4ts/effect';
import { ConsoleStateState, TestConsoleState } from '@fp4ts/effect-test-kit';
import { ConsoleLogger, TimestampLogger } from '@fp4ts/logging-core';
import { LogFormat, LogLevel } from '@fp4ts/logging-kernel';

describe('ConsoleLogger', () => {
  const F = State.Monad<ConsoleStateState>();
  const D = new Date('2020-01-01');
  const L = pipe(
    ConsoleLogger(F, new TestConsoleState()).format(LogFormat.default()),
    TimestampLogger(
      F,
      Clock.of({
        applicative: F,
        monotonic: F.pure(D.valueOf()),
        realTime: F.pure(D.valueOf()),
      }),
    ),
  );

  it('should format the message', () => {
    expect(L.info('msg').runStateS(ConsoleStateState.empty).output).toEqual([
      '2020-01-01T00:00:00.000Z INFO - msg',
    ]);
  });

  it('should format multiple messages', () => {
    expect(
      pipe(
        L.info('msg1'),
        F.productL(L.warn('msg2')),
        F.productL(L.error(new Error('test error'), 'msg3')),
      ).runStateS(ConsoleStateState.empty).output,
    ).toEqual([
      '2020-01-01T00:00:00.000Z INFO - msg1',
      '2020-01-01T00:00:00.000Z WARN - msg2',
      '2020-01-01T00:00:00.000Z ERROR - msg3',
    ]);
  });

  it('should format filter', () => {
    const LL = L.filterMessage(({ level }) => LogLevel.Error === level);
    expect(
      pipe(
        LL.info('msg1'),
        F.productL(LL.warn('msg2')),
        F.productL(LL.error(new Error('test error'), 'msg3')),
      ).runStateS(ConsoleStateState.empty).output,
    ).toEqual(['2020-01-01T00:00:00.000Z ERROR - msg3']);
  });
});
