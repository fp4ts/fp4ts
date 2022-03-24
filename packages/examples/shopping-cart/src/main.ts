// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { pipe } from '@fp4ts/core';
import { FunctionK } from '@fp4ts/cats';
import { Console, IO, IOF, unsafeRunMain } from '@fp4ts/effect';
import { ConsoleLogger, LogFormat, TimestampLogger } from '@fp4ts/logging';
import { HttpLogger } from '@fp4ts/http-server';
import { NodeServerBuilder } from '@fp4ts/http-node-server';

import { IOAppModule } from './modules/infrastructure';

const F = IO.Async;
const logger = HttpLogger(F)<IOF, IOF>(
  pipe(
    ConsoleLogger(F, Console.make(F)).format(LogFormat.default<string>()),
    TimestampLogger(F, F),
  ),
  FunctionK.id<IOF>(),
);
const middleware = logger;

function main(): void {
  unsafeRunMain(
    F.do(function* (_) {
      const appModule = yield* _(IOAppModule.make());

      yield* _(
        NodeServerBuilder.make(F)
          .bindLocal(3000)
          .withHttpApp(middleware(appModule.apiService.toHttpApp))
          .serve()
          .compileConcurrent().last,
      );
    }),
  );
}
main();
