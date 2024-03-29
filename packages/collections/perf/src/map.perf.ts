// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { suite, add, cycle, configure } from 'benny';
import { OrdMap } from '@fp4ts/collections-core';

function makeSuite(size: number) {
  const nums = [...new Array(size).keys()].map((_, i) => i);
  const perm = nums.map(() => (Math.random() * size) | 0);

  const numPs = nums.map(x => [x, x] as [number, number]);
  const permPs = nums.map(x => [x, x] as [number, number]);
  const map = OrdMap.fromArray(numPs);
  const mapr = OrdMap.fromArray(permPs);

  return [
    add(`fromArray (${size})`, () => {
      OrdMap.fromArray(numPs);
    }),

    add(`fromArray random (${size})`, () => {
      OrdMap.fromArray(numPs);
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
      let m: OrdMap<number, number> = OrdMap.empty;
      for (let i = 0; i < size; i++) {
        m = m.insert(i, i);
      }
    }),
    add(`insert random (${size})`, () => {
      let m: OrdMap<number, number> = OrdMap.empty;
      for (let i = 0; i < size; i++) {
        m = m.insert(perm[i], perm[i]);
      }
    }),

    add(`forEach (${size})`, () => {
      let x = 0;
      map.forEach(y => (x += y));
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
