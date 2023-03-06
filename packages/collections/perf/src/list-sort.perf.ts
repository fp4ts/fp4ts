// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { suite, add, cycle, configure } from 'benny';
import { Ord } from '@fp4ts/cats';
import { List } from '@fp4ts/collections-core';

function makeSuite(size: number) {
  const random = [...new Array(size)].map(() => Math.random());
  const randomL = List.fromArray(random);
  const sorted = [...new Array(size).keys()];
  const sortedL = List.fromArray(sorted);
  const reversed = [...new Array(size).keys()].reverse();
  const reversedL = List.fromArray(reversed);

  return [
    add(`List reverse (${size})`, () => {
      sortedL.reverse;
    }),
    add(`List random (${size})`, () => {
      randomL.sort(Ord.fromUniversalCompare());
    }),
    add(`Array random (${size})`, () => {
      [...random].sort((a, b) => a - b);
    }),
    add(`List sorted (${size})`, () => {
      sortedL.sort(Ord.fromUniversalCompare());
    }),
    add(`Array sorted (${size})`, () => {
      [...sorted].sort((a, b) => a - b);
    }),
    add(`List reversed (${size})`, () => {
      reversedL.sort(Ord.fromUniversalCompare());
    }),
    add(`Array reversed (${size})`, () => {
      [...reversed].sort((a, b) => a - b);
    }),
  ];
}

suite('List.sort', ...[10_000, 100_000].flatMap(makeSuite), cycle());
