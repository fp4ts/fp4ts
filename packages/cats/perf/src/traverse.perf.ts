// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { add, configure, cycle, suite } from 'benny';
import { id } from '@fp4ts/core';
import { Traversable } from '@fp4ts/cats-core';
import { Identity } from '@fp4ts/cats-core/lib/data';

function makeSuite(size: number) {
  const xs = [...new Array(size).keys()];

  return [
    add(`Array Identity (${size})`, () => {
      Traversable.Array.traverse_(Identity.Applicative)(xs, id);
    }),
  ];
}

suite(
  'Array Traverse',
  ...[0, 1, 10, 100, 1_000, 10_000].flatMap(makeSuite),
  cycle(),
  configure({ cases: { minSamples: 20, maxTime: 2 } }),
);
