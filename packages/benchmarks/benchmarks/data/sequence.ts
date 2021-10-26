import '../../benchmarking';
import { ok as assert } from 'assert';
import { pipe } from '@fp4ts/core';
import { Vector, List } from '@fp4ts/cats-core/lib/data';

const size = 10_000;

const filledArray = [...new Array(size).keys()];
const filledVector = Vector.fromArray(filledArray);
const filledList = List.fromArray(filledArray);

pipe(
  benchmark.group('construction')(
    benchmark('native array push', () => {
      const xs: number[] = [];
      for (let i = 0; i < size; i++) {
        xs.push(i);
      }
    }),

    benchmark('Vector append', () => {
      const xs: Vector<number> = Vector.empty;
      for (let i = 0; i < size; i++) {
        xs.append(i);
      }
    }),

    benchmark('Vector prepend', () => {
      const xs: Vector<number> = Vector.empty;
      for (let i = size; i > 0; i--) {
        xs.prepend(i);
      }
    }),

    benchmark('List prepend', () => {
      const xs: List<number> = List.empty;
      for (let i = size; i > 0; i--) {
        xs.prepend(i);
      }
    }),
  ),

  benchmark.group('element transformations')(
    benchmark('native array map', () => {
      filledArray.map(x => x * 2);
    }),

    benchmark('native array flatMap', () => {
      filledArray.map(x => [x * 2, x * 2]);
    }),

    benchmark('Vector map', () => {
      filledVector.map(x => x * 2);
    }),

    benchmark('Vector flatMap', () => {
      filledVector.flatMap(x => Vector(x * 2, x * 2));
    }),

    benchmark('List map', () => {
      filledList.map(x => x * 2);
    }),

    benchmark('List flatMap', () => {
      filledList.flatMap(x => List(x * 2, x * 2));
    }),
  ),

  benchmark.group('element access')(
    benchmark('native array', () => {
      for (let i = 0; i < size; i++) {
        assert(filledArray[i] === i);
      }
    }),

    benchmark('Vector', () => {
      for (let i = 0; i < size; i++) {
        assert(filledVector['!!'](i) === i);
      }
    }),

    benchmark('List', () => {
      for (let i = 0; i < size; i++) {
        assert(filledList['!!'](i) === i);
      }
    }),
  ),

  // benchmark('native array', () => {
  //   const xs: number[] = [];
  //   for (let i = 0; i < size; i++) {
  //     xs.push(i);
  //   }

  //   for (let i = 0; i < size; i++) {
  //     assert(xs[i] === i);
  //   }

  //   const yys = xs.map(x => [x * 2, x * 2]);
  //   yys.flatMap(id);
  //   yys.flat();
  // }),

  // benchmark('Vector', () => {
  //   let xs: Vector<number> = Vector.empty;

  //   for (let i = 0; i < size; i++) {
  //     xs = xs.append(i);
  //   }

  //   for (let i = 0; i < size; i++) {
  //     assert(xs['!!'](i) === i);
  //   }

  //   const yys = xs.map(x => Vector(x * 2, x * 2));
  //   yys.flatMap(id);
  //   yys.flatten;
  // }),

  // benchmark('List', () => {
  //   let xs: List<number> = List.empty;

  //   for (let i = size; i > 0; i--) {
  //     xs = xs.prepend(i);
  //   }

  //   for (let i = 0; i < size; i++) {
  //     assert(xs.head === 1);
  //   }

  //   const yys = xs.map(x => List(x * 2, x * 2));
  //   yys.flatMap(id);
  //   yys.flatten;
  // }),

  runBenchmark(),
);
