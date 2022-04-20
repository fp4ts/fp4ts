// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { pipe } from '@fp4ts/core';
import { FunctionK } from '@fp4ts/cats';
import { ConsoleLogger, LogFormat, TimestampLogger } from '@fp4ts/logging';
import { Console, IO, IOF, unsafeRunMain } from '@fp4ts/effect';
import { NodeServerBuilder } from '@fp4ts/http-node-server';
import { HttpLogger } from '@fp4ts/http-server';

import { makeApp } from './server';

const logger = HttpLogger(IO.Async)<IOF, IOF>(
  pipe(
    ConsoleLogger(IO.Applicative, Console.make(IO.Async)).format(
      LogFormat.default<string>(),
    ),
    TimestampLogger(IO.Async, IO.Async),
  ),
  FunctionK.id<IOF>(),
);
const middleware = logger;

function main(): void {
  pipe(
    makeApp(IO.Async).flatMap(
      app =>
        NodeServerBuilder.make(IO.Async)
          .bindLocal(3000)
          .withHttpApp(middleware(app))
          .serve()
          .compileConcurrent().last,
    ),
    unsafeRunMain,
  );
}
main();
