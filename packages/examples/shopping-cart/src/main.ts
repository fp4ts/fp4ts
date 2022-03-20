// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { IO, unsafeRunMain } from '@fp4ts/effect';
import { NodeServerBuilder } from '@fp4ts/http-node-server';

import { IOAppModule } from './modules/infrastructure';

function main(): void {
  unsafeRunMain(
    IO.Monad.do(function* (_) {
      const appModule = yield* _(IOAppModule.make());

      yield* _(
        NodeServerBuilder.make(IO.Async)
          .bindLocal(3000)
          .withHttpApp(appModule.apiService.toHttpApp)
          .serve()
          .compileConcurrent().last,
      );
    }),
  );
}
main();
