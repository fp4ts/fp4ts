// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

type Arguments<F extends (...args: any[]) => any> = F extends (
  ...args: infer A
) => any
  ? A
  : never;

// https://gist.github.com/Gozala/1697037
export function tailrec<F extends (...args: any[]) => any>(f: F): F {
  let result: ReturnType<F>;
  let running = false;
  const accumulated = [] as Arguments<F>[];

  const ff = function accumulator(
    this: ThisParameterType<F>,
    ...args: Arguments<F>
  ): any {
    accumulated.push(args);
    if (!running) {
      running = true;
      while (accumulated.length) result = f.apply(this, accumulated.shift()!);
      running = false;
      return result;
    }
  };

  return ff as F;
}
