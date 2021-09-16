import '../../benchmarking';
import { ok as assert } from 'assert';
import { pipe } from '../../core';
import { Map as CatsMap } from '../../cats/data/collections/map';
import { OrderedMap as CatsOrderedMap } from '../../cats/data/collections/ordered-map';

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

    // assert(m.size === 0);
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

    // assert(m.isEmpty);
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

    // assert(m.isEmpty);
  }),

  runBenchmark(),
);
