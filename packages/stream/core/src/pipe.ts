// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Stream } from './stream';

export type Pipe<F, I, O> = (s: Stream<F, I>) => Stream<F, O>;

export type Pipe2<F, I1, I2, O> = (
  s1: Stream<F, I1>,
  s2: Stream<F, I2>,
) => Stream<F, O>;
