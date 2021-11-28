// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import '../../benchmarking';
import { pipe } from '@fp4ts/core';
import { Stream } from '@fp4ts/stream';

pipe(
  benchmark('zipping', () => {
    const xs = [...new Array(10_000).keys()];
    Stream.fromArray(xs).flatMap(Stream).zip(Stream(1).repeat).compile().toList;
  }),
  runBenchmark({ iterations: 1, warmup: 0 }),
);
