// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import '../../benchmarking';
import { ok as assert } from 'assert';
import { pipe } from '@fp4ts/core';
import {
  HashMap as CatsMap,
  OrderedMap as CatsOrderedMap,
} from '@fp4ts/cats-core/lib/data';

const size = 10_000;
const values: number[] = [...new Array(size).keys()];

pipe(
  benchmark('native map', () => {
    const m = new Map();
    for (let i = 0; i < size; i++) {
      m.set(values[0], values[0]);
    }

    for (let i = 0; i < size; i++) {
      assert(m.get(values[0]) === values[0]);
    }

    for (let i = 0; i < size; i++) {
      m.delete(values[0]);
    }

    assert(m.size === 0);
  }),

  benchmark('cats map', () => {
    let m: CatsMap<number, number> = CatsMap();
    for (let i = 0; i < size; i++) {
      m = m.insert(values[0], values[0]);
    }

    for (let i = 0; i < size; i++) {
      assert(m.lookup(values[0]).get === values[0]);
    }

    for (let i = 0; i < size; i++) {
      m = m.remove(values[0]);
    }

    assert(m.isEmpty);
  }),

  benchmark('cats ordered map', () => {
    let m: CatsOrderedMap<number, number> = CatsOrderedMap();
    for (let i = 0; i < size; i++) {
      m = m.insert(values[0], values[0]);
    }

    for (let i = 0; i < size; i++) {
      assert(m.lookup(values[0]).get === values[0]);
    }

    for (let i = 0; i < size; i++) {
      m = m.remove(values[0]);
    }

    assert(m.isEmpty);
  }),

  runBenchmark(),
);
