// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { ExitCode, Concurrent, Resource, Ref } from '@fp4ts/effect';
import { Stream, SignallingRef, Signal } from '@fp4ts/stream';
import { IpAddress, Ipv4Address } from './ip-address';
import { Server } from './server';

export abstract class ServerBuilder<F, Self extends ServerBuilder<F, Self>> {
  public abstract readonly F: Concurrent<F, Error>;

  public abstract bindHttp(port: number, host: IpAddress): Self;
  public bindLocal(port: number): Self {
    return this.bindHttp(port, Ipv4Address.local);
  }
  public bindAny(): Self {
    return this.bindHttp(0, Ipv4Address.local);
  }

  public abstract resource(): Resource<F, Server>;

  public readonly serve = (): Stream<F, ExitCode> => {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return Stream.Monad<F>().do(function* (_) {
      const signal = yield* _(Stream.evalF(SignallingRef<F>(self.F)(false)));
      const exitCode = yield* _(Stream.evalF(self.F.ref(ExitCode.Success)));
      const serve = yield* _(self.serveWhile(signal, exitCode));
      return serve;
    });
  };

  public readonly serveWhile = (
    terminateWhenTrue: Signal<F, boolean>,
    exitWith: Ref<F, ExitCode>,
  ): Stream<F, ExitCode> =>
    Stream.resource(this.F)(this.resource())
      .flatMap(() => terminateWhenTrue.discrete())
      .takeWhile(x => x === false)
      .drain['+++'](Stream.evalF(exitWith.get()));

  public abstract withBanner(banner: string): Self;
  public abstract withoutBanner(): Self;
}
