// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { IO } from '@fp4ts/effect';
import { Server } from '@fp4ts/http-server';
import { NodeServerBuilder } from '@fp4ts/http-node-server';
import { IOAppModule } from '../infrastructure';

export function withApp(run: (server: Server) => IO<void>): IO<void> {
  return IOAppModule.make().flatMap(module =>
    NodeServerBuilder.make(IO.Async)
      .bindAny()
      .withoutBanner()
      .withHttpApp(module.apiService.toHttpApp)
      .resource()
      .use(IO.Async)(run),
  );
}
