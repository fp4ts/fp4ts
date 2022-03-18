// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { None, Option, Ord, Some } from '@fp4ts/cats';

export type LogLevel =
  | LogLevelObj['Error']
  | LogLevelObj['Warn']
  | LogLevelObj['Info']
  | LogLevelObj['Debug']
  | LogLevelObj['Trace'];

export const LogLevel: LogLevelObj = Object.freeze({
  Error: 'error',
  Warn: 'warn',
  Info: 'info',
  Debug: 'debug',
  Trace: 'trace',

  fromString(s: string): Option<LogLevel> {
    switch (s) {
      case 'error':
        return Some(LogLevel.Error);
      case 'warn':
        return Some(LogLevel.Warn);
      case 'info':
        return Some(LogLevel.Info);
      case 'debug':
        return Some(LogLevel.Debug);
      case 'trace':
        return Some(LogLevel.Trace);
      case 'loglevel.error':
        return Some(LogLevel.Error);
      case 'loglevel.warn':
        return Some(LogLevel.Warn);
      case 'loglevel.info':
        return Some(LogLevel.Info);
      case 'loglevel.debug':
        return Some(LogLevel.Debug);
      case 'loglevel.trace':
        return Some(LogLevel.Trace);
      default:
        return None;
    }
  },

  Ord: Ord.by<number, LogLevel>(Ord.primitive, (lvl: LogLevel) => {
    switch (lvl) {
      case LogLevel.Error:
        return 5;
      case LogLevel.Warn:
        return 4;
      case LogLevel.Info:
        return 3;
      case LogLevel.Debug:
        return 2;
      case LogLevel.Trace:
        return 1;
    }
  }),
});

interface LogLevelObj {
  readonly Error: 'error';
  readonly Warn: 'warn';
  readonly Info: 'info';
  readonly Debug: 'debug';
  readonly Trace: 'trace';

  fromString(s: string): Option<LogLevel>;
  readonly Ord: Ord<LogLevel>;
}
