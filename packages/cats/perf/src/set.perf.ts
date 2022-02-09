// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { suite, add, cycle, configure } from 'benny';
import { Set } from '@fp4ts/cats-core/lib/data';

function makeSuite(size: number) {
  const nums = [...new Array(size).keys()].map((_, i) => i);
  const perm = nums.map(() => (Math.random() * size) | 0);

  const set = Set.fromArray(nums);
  const setr = Set.fromArray(perm);

  return [
    add(`fromArray (${size})`, () => {
      Set.fromArray(nums);
    }),

    add(`fromArray random (${size})`, () => {
      Set.fromArray(perm);
    }),

    add(`lookup identity (${size})`, () => {
      for (let i = 0; i < size; i++) {
        set.contains(i);
      }
    }),
    add(`lookup random (${size})`, () => {
      for (let i = 0; i < size; i++) {
        set.contains(perm[i]);
      }
    }),

    add(`insert (${size})`, () => {
      let m: Set<number> = Set.empty;
      for (let i = 0; i < size; i++) {
        m = m.insert(i);
      }
    }),
    add(`insert random (${size})`, () => {
      let m: Set<number> = Set.empty;
      for (let i = 0; i < size; i++) {
        m = m.insert(perm[i]);
      }
    }),

    add(`iterator (${size})`, () => {
      const it = set.iterator;
      for (let i = it.next(); !i.done; i = it.next()) {}
    }),

    add(`forEach (${size})`, () => {
      let x = 0;
      set.forEach(y => (x += y));
    }),

    add(`filter keep (${size})`, () => {
      set.filter(() => true);
    }),
    add(`filter drop (${size})`, () => {
      set.filter(() => false);
    }),

    add(`filter partial (${size})`, () => {
      set.filter(x => x % 2 === 0);
    }),

    add(`union identity (${size})`, () => {
      set.union(set);
    }),
    add(`union random (${size})`, () => {
      set.union(setr);
    }),
    add(`intersect identity (${size})`, () => {
      set.intersect(set);
    }),
    add(`intersect random (${size})`, () => {
      set.intersect(setr);
    }),
    add(`difference identity (${size})`, () => {
      set.difference(set);
    }),
    add(`difference random (${size})`, () => {
      set.difference(setr);
    }),
  ];
}

suite(
  'Set',
  ...[0, 1, 10, 100, 1_000, 10_000].flatMap(makeSuite),
  cycle(),
  configure({ cases: { minSamples: 20, maxTime: 2 } }),
);
