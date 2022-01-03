// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/no-namespace */
import { performance, PerformanceObserver } from 'perf_hooks';

interface Benchmark {
  (b: Benchmark): Benchmark;
}

abstract class Benchmark {
  public constructor() {
    const apply = function (this: Benchmark, that: Benchmark): Benchmark {
      return new BenchmarkProduct(apply, that) as any as Benchmark;
    };

    Object.setPrototypeOf(apply, this.constructor.prototype);
    for (const prop of Object.getOwnPropertyNames(this))
      Object.defineProperty(
        apply,
        prop,
        Object.getOwnPropertyDescriptor(this, prop)!,
      );
    return apply;
  }
}

class BenchmarkProduct extends Benchmark {
  public tag: 'product' = 'product';
  public constructor(
    public readonly lhs: Benchmark,
    public readonly rhs: Benchmark,
  ) {
    super();
  }
}

class BenchmarkTest extends Benchmark {
  public tag: 'test' = 'test';
  public constructor(
    public readonly testName: string,
    public readonly fn: TestFn,
  ) {
    super();
  }
}

class BenchmarkGroup extends Benchmark {
  public tag: 'group' = 'group';
  public constructor(
    public readonly groupName: string,
    public readonly benchmark: Benchmark,
  ) {
    super();
  }
}

interface BenchmarkFn {
  (name: string, fn: TestFn): Benchmark;
  group: (
    groupName: string,
  ) => (b0: Benchmark, ...bs: Benchmark[]) => Benchmark;
}

const benchmark: BenchmarkFn = function (name: string, fn: TestFn): Benchmark {
  return new BenchmarkTest(name, fn);
};

benchmark.group =
  groupName =>
  (b0, ...bs) =>
    new BenchmarkGroup(
      groupName,
      bs.reduce((b1, b2) => b1(b2), b0),
    );

type View = BenchmarkTest | BenchmarkProduct | BenchmarkGroup;

const view = (b: Benchmark): View => b as any;

interface Config {
  readonly warmup?: number;
  readonly iterations?: number;
}

const runBenchmark =
  ({ warmup = 10, iterations = 10 }: Config = {}) =>
  (b0: Benchmark): Promise<void> => {
    const loop = async (_b: Benchmark, groups: string[] = []) => {
      const b = view(_b);
      if (b.tag === 'product') {
        await loop(b.lhs, groups);
        await loop(b.rhs, groups);
        return;
      } else if (b.tag === 'group') {
        await loop(b.benchmark, [...groups, b.groupName]);
        return;
      }

      // -- Run benchmark

      // Prepare function for testing
      const fn: any = b.fn.length
        ? new Promise((resolve, reject) =>
            // @ts-ignore
            fn(err => (err ? reject(err) : resolve())),
          )
        : b.fn;
      const id = `${groups.join('.')}#${b.testName}`;
      const start = `${id}#start`;
      const end = `${id}#end`;

      // Setup measurements collection
      let idx = 0;
      const measurements = new Array(warmup + iterations);
      const observer = new PerformanceObserver(item => {
        const entry = item.getEntriesByName(id).pop();
        if (!entry) return;
        measurements[idx++] = entry.duration;
      });
      observer.observe({ entryTypes: ['measure'] });

      // Benchmarks
      let i = warmup + iterations;
      while (i-- > 0) {
        performance.clearMarks();
        performance.mark(start);
        const r = fn();
        r instanceof Promise ? await r : {};
        performance.mark(end);
        performance.measure(id, start, end);
      }

      // Disconnect observer
      observer.disconnect();

      // Print out the report
      console.log(
        id,
        measurements.slice(warmup).reduce((a, b) => a + b, 0) / iterations,
      );
    };

    return loop(b0);
  };

type TestFn =
  | (() => Promise<void>)
  | ((done: (error?: Error) => void) => void)
  | (() => void);

declare global {
  export let benchmark: BenchmarkFn;
  export let runBenchmark: (config?: Config) => (b: Benchmark) => Promise<void>;

  namespace NodeJS {
    export interface Global {
      benchmark: BenchmarkFn;
      runBenchmark: (config?: Config) => (b: Benchmark) => Promise<void>;
    }
  }
}

global.benchmark = benchmark;
global.runBenchmark = runBenchmark;
