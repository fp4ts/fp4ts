// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Base, instance, Kind } from '@fp4ts/core';
import { Logger } from './logger';

export interface StructuredLogging<F> extends Base<F> {
  error(context: Record<string, string>): (message: string) => Kind<F, [void]>;
  error(
    context: Record<string, string>,
  ): (error: Error, message: string) => Kind<F, [void]>;

  warn(context: Record<string, string>): (message: string) => Kind<F, [void]>;
  warn(
    context: Record<string, string>,
  ): (error: Error, message: string) => Kind<F, [void]>;

  info(context: Record<string, string>): (message: string) => Kind<F, [void]>;
  info(
    context: Record<string, string>,
  ): (error: Error, message: string) => Kind<F, [void]>;

  debug(context: Record<string, string>): (message: string) => Kind<F, [void]>;
  debug(
    context: Record<string, string>,
  ): (error: Error, message: string) => Kind<F, [void]>;

  trace(context: Record<string, string>): (message: string) => Kind<F, [void]>;
  trace(
    context: Record<string, string>,
  ): (error: Error, message: string) => Kind<F, [void]>;

  addContext(context: Record<string, string>): StructuredLogging<F>;
}

export const StructuredLogging = Object.freeze({
  fromLogger: <F>(logger: Logger<F, string>): StructuredLogging<F> =>
    instance<StructuredLogging<F>>({
      error: (ctx: Record<string, string>) => (error: any, message?: any) =>
        typeof message === 'string'
          ? logger.addContext(ctx).error(error, message)
          : logger.addContext(ctx).error(message),
      warn: (ctx: Record<string, string>) => (error: any, message?: any) =>
        typeof message === 'string'
          ? logger.addContext(ctx).warn(error, message)
          : logger.addContext(ctx).warn(message),
      info: (ctx: Record<string, string>) => (error: any, message?: any) =>
        typeof message === 'string'
          ? logger.addContext(ctx).info(error, message)
          : logger.addContext(ctx).info(message),
      debug: (ctx: Record<string, string>) => (error: any, message?: any) =>
        typeof message === 'string'
          ? logger.addContext(ctx).debug(error, message)
          : logger.addContext(ctx).debug(message),
      trace: (ctx: Record<string, string>) => (error: any, message?: any) =>
        typeof message === 'string'
          ? logger.addContext(ctx).trace(error, message)
          : logger.addContext(ctx).trace(message),

      addContext: (ctx: Record<string, string>) =>
        StructuredLogging.fromLogger(logger.addContext(ctx)),
    }),
});
