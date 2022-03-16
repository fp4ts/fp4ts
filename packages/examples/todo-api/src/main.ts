// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { pipe } from '@fp4ts/core';
import { IO, unsafeRunMain } from '@fp4ts/effect';
import { NodeServerBuilder } from '@fp4ts/http-node-server';

import { makeApp } from './server';

function main(): void {
  pipe(
    makeApp(IO.Async).flatMap(
      app =>
        NodeServerBuilder.make(IO.Async)
          .bindLocal(3000)
          .withHttpApp(app)
          .serve()
          .compileConcurrent().last,
    ),
    unsafeRunMain,
  );
}
main();
