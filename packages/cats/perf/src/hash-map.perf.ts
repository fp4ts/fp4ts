// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { suite, add, cycle, configure } from 'benny';
import { Hashable } from '@fp4ts/cats-kernel';
import { HashMap } from '@fp4ts/cats-core/lib/data';

function makeSuite(size: number) {
  const nums = [...new Array(size).keys()].map((_, i) => i);
  const perm = nums.map(() => (Math.random() * size) | 0);

  const numPs = nums.map(x => [x, x] as [number, number]);
  const permPs = nums.map(x => [x, x] as [number, number]);
  const map = HashMap.fromArray(Hashable.any<number>())(numPs);
  const mapr = HashMap.fromArray(Hashable.any<number>())(permPs);

  return [
    add(`fromArray (${size})`, () => {
      HashMap.fromArray(Hashable.any())(numPs);
    }),

    add(`fromArray random (${size})`, () => {
      HashMap.fromArray(Hashable.any())(numPs);
    }),

    add(`lookup identity (${size})`, () => {
      for (let i = 0; i < size; i++) {
        map.lookup(i);
      }
    }),

    add(`lookup random (${size})`, () => {
      for (let i = 0; i < size; i++) {
        map.lookup(perm[i]);
      }
    }),

    add(`insert (${size})`, () => {
      let m: HashMap<number, number> = HashMap.empty;
      for (let i = 0; i < size; i++) {
        m = m.insert(i, i);
      }
    }),
    add(`insert random (${size})`, () => {
      let m: HashMap<number, number> = HashMap.empty;
      for (let i = 0; i < size; i++) {
        m = m.insert(perm[i], perm[i]);
      }
    }),

    add(`filter keep (${size})`, () => {
      map.filter(() => true);
    }),
    add(`filter drop (${size})`, () => {
      map.filter(() => false);
    }),
    add(`filter partial (${size})`, () => {
      map.filter(x => x % 2 === 0);
    }),

    add(`union identity (${size})`, () => {
      map.union(map);
    }),
    add(`union random (${size})`, () => {
      map.union(mapr);
    }),
    add(`intersect identity (${size})`, () => {
      map.intersect(map);
    }),
    add(`intersect random (${size})`, () => {
      map.intersect(mapr);
    }),
    add(`difference identity (${size})`, () => {
      map.difference(map);
    }),
    add(`difference random (${size})`, () => {
      map.difference(mapr);
    }),
  ];
}

suite(
  'Map',
  ...[0, 1, 10, 100, 1_000, 10_000].flatMap(makeSuite),
  cycle(),
  configure({ cases: { minSamples: 20, maxTime: 2 } }),
);
