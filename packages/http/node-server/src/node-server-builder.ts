// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { None, Option, Some } from '@fp4ts/cats';
import { Async, Console, Resource } from '@fp4ts/effect';
import { HttpApp } from '@fp4ts/http-core';
import {
  banner,
  IpAddress,
  Ipv4Address,
  Server,
  ServerBuilder,
} from '@fp4ts/http-server';
import { serve } from './serve';

export class NodeServerBuilder<F> extends ServerBuilder<
  F,
  NodeServerBuilder<F>
> {
  private constructor(
    public readonly F: Async<F>,
    private readonly app: HttpApp<F>,
    private readonly banner: Option<string>,
    private readonly port: number,
    private readonly host: IpAddress,
  ) {
    super();
  }

  public bindHttp(port: number, host: IpAddress): NodeServerBuilder<F> {
    return this.copy({ port, host });
  }

  public withHttpApp(app: HttpApp<F>): NodeServerBuilder<F> {
    return this.copy({ app });
  }

  public resource(): Resource<F, Server> {
    return Resource.evalF(this.printBanner())['>>>'](
      serve(this.F)(this.app, this.port, this.host.toString()),
    );
  }

  public withBanner(banner: string): NodeServerBuilder<F> {
    return this.copy({ banner: Some(banner) });
  }
  public withoutBanner(): NodeServerBuilder<F> {
    return this.copy({ banner: None });
  }

  private copy({
    app = this.app,
    banner = this.banner,
    port = this.port,
    host = this.host,
  }: Partial<Props<F>> = {}): NodeServerBuilder<F> {
    return new NodeServerBuilder(this.F, app, banner, port, host);
  }

  private printBanner(): Kind<F, [void]> {
    const C = Console.make(this.F);
    return this.banner.fold(
      () => this.F.unit,
      banner => C.print(banner),
    );
  }

  public static make<F>(
    F: Async<F>,
    {
      app = defaults.app(F),
      banner = defaults.banner,
      port = defaults.port,
      host = defaults.host,
    }: Partial<Props<F>> = {},
  ): NodeServerBuilder<F> {
    return new NodeServerBuilder(F, app, banner, port, host);
  }
}

type Props<F> = {
  readonly app: HttpApp<F>;
  readonly banner: Option<string>;
  readonly port: number;
  readonly host: IpAddress;
};
const defaults = {
  app: HttpApp.empty,
  banner: Some(banner),
  port: 0,
  host: Ipv4Address.local,
};
