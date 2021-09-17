import '../../benchmarking';
import { ok as assert } from 'assert';
import { id, pipe } from '../../core';

import { Vector } from '../../cats/data/collections/vector';
import { List } from '../../cats/data/collections/list';

const size = 10_000;

pipe(
  benchmark('native array', () => {
    const xs: number[] = [];
    for (let i = 0; i < size; i++) {
      xs.push(i);
    }

    for (let i = 0; i < size; i++) {
      assert(xs[i] === i);
    }

    const yys = xs.map(x => [x * 2, x * 2]);
    yys.flatMap(id);
    yys.flat();
  }),

  benchmark('Vector', () => {
    let xs: Vector<number> = Vector.empty;

    for (let i = 0; i < size; i++) {
      xs = xs.append(i);
    }

    for (let i = 0; i < size; i++) {
      assert(xs['!!'](i) === i);
    }

    const yys = xs.map(x => Vector(x * 2, x * 2));
    yys.flatMap(id);
    yys.flatten;
  }),

  benchmark('List', () => {
    let xs: List<number> = List.empty;

    for (let i = size; i > 0; i--) {
      xs = xs.prepend(i);
    }

    for (let i = 0; i < size; i++) {
      assert(xs.head === 1);
    }

    const yys = xs.map(x => List(x * 2, x * 2));
    yys.flatMap(id);
    yys.flatten;
  }),

  runBenchmark(),
);
