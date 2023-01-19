// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { TestExecutionContext } from './test-execution-context';

export class Ticker {
  public constructor(
    public readonly ctx: TestExecutionContext = new TestExecutionContext(),
  ) {}
}
