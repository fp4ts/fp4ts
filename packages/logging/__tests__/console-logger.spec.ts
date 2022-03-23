// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { pipe } from '@fp4ts/core';
import { State } from '@fp4ts/cats';
import { Clock } from '@fp4ts/effect';
import { ConsoleStateState, TestConsoleState } from '@fp4ts/effect-test-kit';
import { ConsoleLogger, TimestampLogger } from '@fp4ts/logging-core';
import { LogFormat, LogLevel } from '@fp4ts/logging-kernel';

describe('ConsoleLogger', () => {
  const F = State.Monad<ConsoleStateState>();
  const D = new Date('2020-01-01');
  const L = TimestampLogger(
    F,
    Clock.of({
      applicative: F,
      monotonic: F.pure(D.valueOf()),
      realTime: F.pure(D.valueOf()),
    }),
    ConsoleLogger(F, new TestConsoleState()).format(LogFormat.default),
  );

  it('should format the message', () => {
    expect(L.info('msg').runS(ConsoleStateState.empty).value.output).toEqual([
      'timestamp: 2020-01-01T00:00:00.000Z                   level: info message: "msg"',
    ]);
  });

  it('should format multiple messages', () => {
    expect(
      pipe(
        L.info('msg1'),
        F.productL(L.warn('msg2')),
        F.productL(L.error(new Error('test error'), 'msg3')),
      ).runS(ConsoleStateState.empty).value.output,
    ).toEqual([
      'timestamp: 2020-01-01T00:00:00.000Z                   level: info message: "msg1"',
      'timestamp: 2020-01-01T00:00:00.000Z                   level: warn message: "msg2"',
      'timestamp: 2020-01-01T00:00:00.000Z                   level: error message: "msg3"',
    ]);
  });

  it('should format filter', () => {
    const LL = L.filterMessage(({ level }) => LogLevel.Error === level);
    expect(
      pipe(
        LL.info('msg1'),
        F.productL(LL.warn('msg2')),
        F.productL(LL.error(new Error('test error'), 'msg3')),
      ).runS(ConsoleStateState.empty).value.output,
    ).toEqual([
      'timestamp: 2020-01-01T00:00:00.000Z                   level: error message: "msg3"',
    ]);
  });
});
