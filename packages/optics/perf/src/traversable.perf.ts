// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { focus } from '@fp4ts/optics-core';
import { add, configure, cycle, suite } from 'benny';

function makeSuite(size: number) {
  const xs = [...new Array(size).keys()];

  return [
    add(`optics filter . modify (${size})`, () => {
      focus<number[]>()
        .each()
        .filter(x => x % 2 === 0)
        .modify(x => x + 1)(xs);
    }),

    add(`plain filter . modify (${size})`, () => {
      xs.filter(x => x % 2 === 0).map(x => x + 1);
    }),

    add(`optics filter . filter . modify (${size})`, () => {
      focus<number[]>()
        .each()
        .filter(x => x % 2 !== 0)
        .filter(x => x % 3 !== 0)
        .modify(x => x + 1)(xs);
    }),

    add(`plain filter . filter . modify (${size})`, () => {
      xs.filter(x => x % 2 !== 0)
        .filter(x => x % 3 !== 0)
        .map(x => x + 1);
    }),

    add(`optics filter (x10) . modify (${size})`, () => {
      focus<number[]>()
        .each()
        .filter(x => true)
        .filter(x => true)
        .filter(x => true)
        .filter(x => true)
        .filter(x => true)
        .filter(x => true)
        .filter(x => true)
        .filter(x => true)
        .filter(x => true)
        .filter(x => true)
        .modify(x => x + 1)(xs);
    }),

    add(`plain filter (x10) . modify (${size})`, () => {
      xs.filter(x => true)
        .filter(x => true)
        .filter(x => true)
        .filter(x => true)
        .filter(x => true)
        .filter(x => true)
        .filter(x => true)
        .filter(x => true)
        .filter(x => true)
        .filter(x => true)
        .map(x => x + 1);
    }),
  ];
}

suite(
  'Traversable',
  ...[0, 1, 10, 100, 1_000, 10_000].flatMap(makeSuite),
  cycle(),
  configure({ cases: { minSamples: 20, maxTime: 2 } }),
);
