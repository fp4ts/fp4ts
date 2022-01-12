// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { pipe } from '@fp4ts/core';
import { IO, unsafeRunMain } from '@fp4ts/effect';

import { makeServer } from './server';

function main(): void {
  pipe(
    makeServer(IO.Async)(3000).use(IO.Async)(() => IO.never),
    unsafeRunMain,
  );
}
main();
