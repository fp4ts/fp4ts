// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { List, ListF, None, Some } from '@fp4ts/cats';
import { LogLevel, LogMessage, WriterLogger } from '@fp4ts/logging-kernel';

describe('Logger', () => {
  const M = List.Alternative.algebra<LogMessage<string>>();
  const L = WriterLogger<ListF, string>(List.Alternative);

  it('should append various levels to the list', () => {
    const xs = L.error('my error')
      .productL(L.warn('my warn'))
      .productL(L.info('my info'))
      .productL(L.debug('my debug'))
      .productL(L.trace('my trace'));

    expect(xs.written().runA(null, undefined, M)).toEqual(
      List(
        new LogMessage(LogLevel.Error, 'my error'),
        new LogMessage(LogLevel.Warn, 'my warn'),
        new LogMessage(LogLevel.Info, 'my info'),
        new LogMessage(LogLevel.Debug, 'my debug'),
        new LogMessage(LogLevel.Trace, 'my trace'),
      ),
    );
  });

  describe('filter', () => {
    it('should allow only error and warn levels', () => {
      const LL = L.filterMessage(
        ({ level }) => level === LogLevel.Error || level === LogLevel.Warn,
      );
      const xs = LL.error('my error')
        .productL(LL.warn(new Error('test error'), 'my warn'))
        .productL(LL.info('my info'))
        .productL(LL.debug('my debug'))
        .productL(LL.trace('my trace'));

      expect(xs.written().runA(null, undefined, M)).toEqual(
        List(
          new LogMessage(LogLevel.Error, 'my error'),
          new LogMessage(
            LogLevel.Warn,
            'my warn',
            Some(new Error('test error')),
          ),
        ),
      );
    });

    it('should not allow trace and info messages', () => {
      const LL = L.filterMessage(
        ({ level }) => level === LogLevel.Trace || level === LogLevel.Info,
      );
      const xs = LL.error('my error')
        .productL(LL.warn(new Error('test error'), 'my warn'))
        .productL(LL.info('my info'))
        .productL(LL.debug('my debug'))
        .productL(LL.trace('my trace'));

      expect(xs.written().runA(null, undefined, M)).toEqual(
        List(
          new LogMessage(LogLevel.Info, 'my info'),
          new LogMessage(LogLevel.Trace, 'my trace'),
        ),
      );
    });

    it('should not allow any messages to be logged', () => {
      const LL = L.filterMessage(() => false);
      const xs = LL.error('my error')
        .productL(LL.warn(new Error('test error'), 'my warn'))
        .productL(LL.info('my info'))
        .productL(LL.debug('my debug'))
        .productL(LL.trace('my trace'));

      expect(xs.written().runA(null, undefined, M)).toEqual(List.empty);
    });
  });

  describe('context', () => {
    it('should add a context to the logger', () => {
      expect(
        L.addContext({ test: '42' })
          .info('msg')
          .written()
          .runA(null, undefined, M),
      ).toEqual(
        List(new LogMessage(LogLevel.Info, 'msg', None, { test: '42' })),
      );
    });

    it('should context should be set for every subsequent invocation', () => {
      const LL = L.addContext({ test: '42' });

      expect(
        LL.info('msg1')
          .productL(LL.debug('msg2'))
          .written()
          .runA(null, undefined, M),
      ).toEqual(
        List(
          new LogMessage(LogLevel.Info, 'msg1', None, { test: '42' }),
          new LogMessage(LogLevel.Debug, 'msg2', None, { test: '42' }),
        ),
      );
    });

    it('should context should not effect two different scopes', () => {
      const L1 = L.addContext({ test1: '42' });
      const L2 = L.addContext({ test2: '42' });

      expect(
        L1.info('msg1')
          .productL(L2.debug('msg2'))
          .written()
          .runA(null, undefined, M),
      ).toEqual(
        List(
          new LogMessage(LogLevel.Info, 'msg1', None, { test1: '42' }),
          new LogMessage(LogLevel.Debug, 'msg2', None, { test2: '42' }),
        ),
      );
    });
  });

  describe('contramap', () => {
    it('should convert incomming values', () => {
      expect(
        L.contramap((x: number) => `${x}`)
          .info(42)
          .written()
          .runA(null, undefined, M),
      ).toEqual(List(new LogMessage(LogLevel.Info, '42')));
    });

    it('should not affect different instances', () => {
      const L1 = L.contramap((x: number) => `${x}`);
      const L2 = L.contramap((x: { value: number }) => `{ value: ${x.value} }`);

      expect(
        L1.info(42)
          .productL(L2.debug({ value: 99 }))
          .written()
          .runA(null, undefined, M),
      ).toEqual(
        List(
          new LogMessage(LogLevel.Info, '42'),
          new LogMessage(LogLevel.Debug, '{ value: 99 }'),
        ),
      );
    });
  });

  describe('composition', () => {
    it('should log using both loggers', () => {
      const LL = L['+++'](L);

      expect(LL.info('msg').written().runA(null, undefined, M)).toEqual(
        List(
          new LogMessage(LogLevel.Info, 'msg'),
          new LogMessage(LogLevel.Info, 'msg'),
        ),
      );
    });

    it('should concatenate loggers using different filters', () => {
      const L1 = L.filterMessage(({ level }) => level === LogLevel.Error);
      const L2 = L.filterMessage(({ level }) => level === LogLevel.Debug);
      const L3 = L.filterMessage(
        ({ level }) => level === LogLevel.Error || level === LogLevel.Debug,
      );
      const LL = L1['+++'](L2)['+++'](L3);

      expect(
        LL.error('msg1')
          .productL(LL.debug('msg2'))
          .productL(LL.info('msg3'))
          .written()
          .runA(null, undefined, M),
      ).toEqual(
        List(
          new LogMessage(LogLevel.Error, 'msg1'),
          new LogMessage(LogLevel.Error, 'msg1'),
          new LogMessage(LogLevel.Debug, 'msg2'),
          new LogMessage(LogLevel.Debug, 'msg2'),
        ),
      );
    });
  });
});
