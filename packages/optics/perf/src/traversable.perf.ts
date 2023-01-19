// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { pipe } from '@fp4ts/core';
import { focus } from '@fp4ts/optics-core';
import * as A from 'fp-ts/Array';
import * as L from 'monocle-ts/Lens';
import * as T from 'monocle-ts/Traversal';
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

    add(`monocle-ts filter . modify (${size})`, () => {
      pipe(
        L.id<number[]>(),
        L.composeTraversal(T.fromTraversable(A.Traversable)()),
        T.filter(x => x % 2 == 0),
        T.modify(x => x + 1),
      )(xs);
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

    add(`monocle-ts filter . filter . modify (${size})`, () => {
      pipe(
        L.id<number[]>(),
        L.composeTraversal(T.fromTraversable(A.Traversable)()),
        T.filter(x => x % 2 == 0),
        T.filter(x => x % 3 == 0),
        T.modify(x => x + 1),
      )(xs);
    }),

    add(`plain filter . filter . modify (${size})`, () => {
      xs.filter(x => x % 2 !== 0)
        .filter(x => x % 3 !== 0)
        .map(x => x + 1);
    }),
  ];
}

suite(
  'Traversable',
  ...[10, 100, 1_000].flatMap(makeSuite),
  cycle(),
  configure({ cases: { minSamples: 20, maxTime: 2 } }),
);
