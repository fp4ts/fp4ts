// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

export interface ExecutionContext {
  readonly executeAsync: (thunk: () => void) => void;
  readonly sleep: (ms: number, thunk: () => void) => () => void;
  readonly currentTimeMicros: () => number;
  readonly currentTimeMillis: () => number;
  readonly reportFailure: (e: Error) => void;
}

export const GlobalExecutionContext: ExecutionContext = Object.freeze({
  executeAsync: thunk => setImmediate(thunk),
  sleep: (ms, thunk) => {
    const ref = setTimeout(thunk, ms);
    return () => clearTimeout(ref);
  },
  currentTimeMicros: (): number => process.hrtime()[0],
  currentTimeMillis: (): number => Date.now(),
  reportFailure: (e: Error): void => console.error(e),
});
