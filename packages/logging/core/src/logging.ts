// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Base, instance, Kind } from '@fp4ts/core';
import { Logger } from './logger';

export interface Logging<F> extends Base<F> {
  error(message: string): Kind<F, [void]>;
  error(error: Error, message: string): Kind<F, [void]>;

  warn(message: string): Kind<F, [void]>;
  warn(error: Error, message: string): Kind<F, [void]>;

  info(message: string): Kind<F, [void]>;
  info(error: Error, message: string): Kind<F, [void]>;

  debug(message: string): Kind<F, [void]>;
  debug(error: Error, message: string): Kind<F, [void]>;

  trace(message: string): Kind<F, [void]>;
  trace(error: Error, message: string): Kind<F, [void]>;
}

export const Logging = Object.freeze({
  fromLogger: <F>(logger: Logger<F, string>): Logging<F> =>
    instance<Logging<F>>({
      error: (error: any, message?: any) =>
        typeof message === 'string'
          ? logger.error(error, message)
          : logger.error(message),
      warn: (error: any, message?: any) =>
        typeof message === 'string'
          ? logger.warn(error, message)
          : logger.warn(message),
      info: (error: any, message?: any) =>
        typeof message === 'string'
          ? logger.info(error, message)
          : logger.info(message),
      debug: (error: any, message?: any) =>
        typeof message === 'string'
          ? logger.debug(error, message)
          : logger.debug(message),
      trace: (error: any, message?: any) =>
        typeof message === 'string'
          ? logger.trace(error, message)
          : logger.trace(message),
    }),
});
