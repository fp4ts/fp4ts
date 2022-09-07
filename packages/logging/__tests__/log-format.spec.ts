// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { List, Show, Some } from '@fp4ts/cats';
import { Writer } from '@fp4ts/cats-mtl';
import {
  Logger,
  logFormat,
  level,
  LogFormat,
  message,
  quoted,
  label,
  bracketed,
  context,
  contextKey,
  LogMessage,
} from '@fp4ts/logging-kernel';

describe('LogFormat', () => {
  const M = List.Alternative.algebra<string>();
  const F = Writer.Monad<List<string>>();
  const mkLogger = <A>(format: LogFormat<A>) =>
    new Logger(F, (msg: LogMessage<A>) => Writer.tell(List(format(msg))));

  it('should accept and empty format', () => {
    const f = logFormat``;
    const L = mkLogger(f);

    expect(L.info('test').written().runWriterA(M)).toEqual(List(''));
  });

  it('should accept and format with a level', () => {
    const f = logFormat`${level}`;
    const L = mkLogger(f);

    expect(L.info('test').written().runWriterA(M)).toEqual(List('INFO'));
  });

  it('should accept and format with a bracketed level', () => {
    const f = logFormat`${bracketed(level)}`;
    const L = mkLogger(f);

    expect(L.info('test').written().runWriterA(M)).toEqual(List('[INFO]'));
  });

  it('should accept and format with a labeled level', () => {
    const f = logFormat`${label('Level', level)}`;
    const L = mkLogger(f);

    expect(L.info('test').written().runWriterA(M)).toEqual(List('Level: INFO'));
  });

  it('should accept and format with a message', () => {
    const f = logFormat`${message(Show.fromToString<number[]>())}`;
    const L = mkLogger(f);

    expect(L.info([1, 2, 3]).written().runWriterA(M)).toEqual(List('1,2,3'));
  });

  it('should accept and format with a quoted message', () => {
    const f = logFormat`${quoted(message(Show.fromToString<number[]>()))}`;
    const L = mkLogger(f);

    expect(L.info([1, 2, 3]).written().runWriterA(M)).toEqual(List('"1,2,3"'));
  });

  it('should extract the key from the context', () => {
    const f = logFormat`${context(({ myKey }) => myKey)}`;
    const L = mkLogger(f);

    expect(
      L.addContext({ myKey: 'ctx' }).info([1, 2, 3]).written().runWriterA(M),
    ).toEqual(List('ctx'));
  });

  it('should extract the key from the context', () => {
    const f = logFormat`${contextKey('myKey')}`;
    const L = mkLogger(f);

    expect(
      L.addContext({ myKey: 'ctx' }).info([1, 2, 3]).written().runWriterA(M),
    ).toEqual(List('ctx'));
  });

  it('should use the default log format', () => {
    const f = LogFormat.default();
    const L = mkLogger(f);
    const T = new Date('2020-01-01');

    expect(
      L.contramapMessage(msg => msg.copy({ timestamp: Some(T) }))
        .info('my message')
        .written()
        .runWriterA(M),
    ).toEqual(List('2020-01-01T00:00:00.000Z INFO - my message'));
  });
});
