// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, cached, Kind, lazyVal, TyK, TyVar } from '@fp4ts/core';
import {
  Alternative,
  Applicative,
  Contravariant,
  FlatMap,
  FunctionK,
  MonoidK,
  Option,
  Some,
  Writer,
  WriterF,
  WriterT,
  WriterTF,
} from '@fp4ts/cats';
import { LogLevel } from './log-level';
import { LogFormat } from './log-format';
import { LogMessage } from './log-message';

export function WriterLogger<G, A>(
  G: Alternative<G>,
): Logger<WriterF<Kind<G, [LogMessage<A>]>>, A> {
  const GW = Writer.Monad();
  return new Logger(GW, (msg: LogMessage<A>) =>
    Writer.tell(G.pure(msg)),
  ) as any;
}

export function WriterTLogger<F, G, A>(
  F: Applicative<F>,
  G: Alternative<G>,
): Logger<$<WriterTF, [F, Kind<G, [LogMessage<A>]>]>, A> {
  const GW = WriterT.Applicative<F, Kind<G, [LogMessage<A>]>>(F);
  return new Logger(GW, msg => WriterT.tell(F)(G.pure(msg)));
}

export class Logger<F, A> {
  public static empty =
    <F>(F: Applicative<F>) =>
    <A = unknown>(): Logger<F, A> =>
      new Logger(F, () => F.unit);

  public constructor(
    protected readonly F: Applicative<F>,
    public readonly log: (msg: LogMessage<A>) => Kind<F, [void]>,
  ) {}

  public error(message: A): Kind<F, [void]>;
  public error(error: Error, message: A): Kind<F, [void]>;
  public error(...args: any[]): Kind<F, [void]> {
    return this.log(this.buildMessage(LogLevel.Error, args));
  }

  public warn(message: A): Kind<F, [void]>;
  public warn(error: Error, message: A): Kind<F, [void]>;
  public warn(...args: any[]): Kind<F, [void]> {
    return this.log(this.buildMessage(LogLevel.Warn, args));
  }

  public info(message: A): Kind<F, [void]>;
  public info(error: Error, message: A): Kind<F, [void]>;
  public info(...args: any[]): Kind<F, [void]> {
    return this.log(this.buildMessage(LogLevel.Info, args));
  }

  public debug(message: A): Kind<F, [void]>;
  public debug(error: Error, message: A): Kind<F, [void]>;
  public debug(...args: any[]): Kind<F, [void]> {
    return this.log(this.buildMessage(LogLevel.Debug, args));
  }

  public trace(message: A): Kind<F, [void]>;
  public trace(error: Error, message: A): Kind<F, [void]>;
  public trace(...args: any[]): Kind<F, [void]> {
    return this.log(this.buildMessage(LogLevel.Trace, args));
  }

  public addContext(context: Record<string, string>): Logger<F, A> {
    return new Logger(this.F, msg =>
      this.log(msg.transformContext(ctx => ({ ...ctx, ...context }))),
    );
  }

  public format<B>(
    this: Logger<F, string>,
    format: LogFormat<B>,
  ): Logger<F, B> {
    return this.contramapMessage(msg => msg.withMessage(format(msg)));
  }

  public concat<B extends A>(that: Logger<F, B>): Logger<F, B> {
    return new Logger(this.F, msg =>
      this.F.void(this.F.product_(this.log(msg), that.log(msg))),
    );
  }
  public '+++'<B extends A>(that: Logger<F, B>): Logger<F, B> {
    return this.concat(that);
  }

  public contramap<B>(f: (b: B) => A): Logger<F, B> {
    return this.contramapMessage(msg => msg.map(f));
  }

  public contramapMessage<B>(
    f: (b: LogMessage<B>) => LogMessage<A>,
  ): Logger<F, B> {
    return new Logger(this.F, mb => this.log(f(mb)));
  }

  public contramapMessageF(
    F: FlatMap<F>,
  ): <B>(f: (b: LogMessage<B>) => Kind<F, [LogMessage<A>]>) => Logger<F, B> {
    return f => new Logger(this.F, mb => F.flatMap_(f(mb), this.log));
  }

  public filter(f: (a: A) => boolean): Logger<F, A> {
    return this.filterMessage(msg => f(msg.message));
  }

  public filterMessage(f: (a: LogMessage<A>) => boolean): Logger<F, A> {
    return new Logger(this.F, msg => (f(msg) ? this.log(msg) : this.F.unit));
  }

  public collect<B>(f: (a: B) => Option<A>): Logger<F, B> {
    return this.collectMessage(msg =>
      f(msg.message).map(m => msg.withMessage(m)),
    );
  }

  public collectMessage<B>(
    f: (a: LogMessage<B>) => Option<LogMessage<A>>,
  ): Logger<F, B> {
    return new Logger(this.F, msg => f(msg).fold(() => this.F.unit, this.log));
  }

  public mapK<G>(G: Applicative<G>, nt: FunctionK<F, G>): Logger<G, A> {
    return new TransformLogger(G, this, nt);
  }

  private buildMessage(lvl: LogLevel, args: any[]): LogMessage<A> {
    return args.length === 2
      ? new LogMessage(lvl, args[1], Some(args[0]))
      : new LogMessage(lvl, args[0]);
  }

  // -- Instances

  public static readonly Contravariant: <F>() => Contravariant<
    $<LoggerF, [F]>
  > = lazyVal(() =>
    Contravariant.of({ contramap_: (fa, f) => fa.contramap(f) }),
  );

  public static readonly MonoidK: <F>(
    F: Applicative<F>,
  ) => MonoidK<$<LoggerF, [F]>> = cached(F =>
    MonoidK.of({ emptyK: Logger.empty(F), combineK_: (x, y) => x.concat(y()) }),
  );
}

// -- HKT

export interface LoggerF extends TyK<[unknown, unknown]> {
  [$type]: Logger<TyVar<this, 0>, TyVar<this, 1>>;
}

class TransformLogger<F, G, A> extends Logger<G, A> {
  public constructor(
    G: Applicative<G>,
    self: Logger<F, A>,
    nt: FunctionK<F, G>,
  ) {
    super(G, msg => nt(self.log(msg)));
  }
}
