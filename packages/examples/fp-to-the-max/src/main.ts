// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { pipe } from '@fp4ts/core';
import { IO, IoK, unsafeRunMain } from '@fp4ts/effect';
import { Console, Random } from '@fp4ts/effect';

import { Program } from './dsl';
import { run } from './program';

function main(): void {
  const C = Console.make(IO.Async);
  const R = Random.make(IO.Async);
  const IOProgram: Program<IoK> = {
    ...IO.Monad,
    readLine: C.readLine,
    printLn: a => C.printLn(a),
    nextIntBetween: (min, max) => R.nextIntBetween(min, max),
  };

  pipe(run(IOProgram), unsafeRunMain);
}

main();
