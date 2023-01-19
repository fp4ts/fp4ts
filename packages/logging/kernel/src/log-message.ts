// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { None, Option, Some } from '@fp4ts/cats';
import { LogLevel } from './log-level';

export class LogMessage<A> {
  public constructor(
    public readonly level: LogLevel,
    public readonly message: A,
    public readonly error: Option<Error> = None,
    public readonly context: Record<string, string> = {},
    public readonly timestamp: Option<Date> = None,
  ) {}

  public copy({
    level = this.level,
    message = this.message,
    error = this.error,
    context = this.context,
    timestamp = this.timestamp,
  }: Partial<Props<A>> = {}): LogMessage<A> {
    return new LogMessage(level, message, error, context, timestamp);
  }

  public map<B>(f: (a: A) => B): LogMessage<B> {
    return this.withMessage(f(this.message));
  }

  public withLevel(level: LogLevel): LogMessage<A> {
    return this.copy({ level });
  }

  public withMessage<B>(message: B): LogMessage<B> {
    const { level, error, context, timestamp } = this;
    return new LogMessage(level, message, error, context, timestamp);
  }

  public withError(error: Error): LogMessage<A> {
    return this.copy({ error: Some(error) });
  }

  public withContext(context: Record<string, string>): LogMessage<A> {
    return this.copy({ context });
  }

  public transformContext(
    f: (ctx: Record<string, string>) => Record<string, string>,
  ): LogMessage<A> {
    return this.copy({ context: f(this.context) });
  }

  public withTimestamp(timestamp: Date): LogMessage<A> {
    return this.copy({ timestamp: Some(timestamp) });
  }
}

type Props<A> = Pick<
  LogMessage<A>,
  'level' | 'message' | 'error' | 'context' | 'timestamp'
>;
