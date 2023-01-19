// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { AndThen, Concat, View } from './algebra';

export function runLoop_<A, B>(f: AndThen<A, B>, start: A): B {
  let current: unknown = start;
  let self: View<unknown, B> = f as View<unknown, B>;

  while (self.tag !== 'single') {
    const leftV = self.left as View<unknown, unknown>;
    if (leftV.tag === 'single') {
      self = self.right as View<unknown, B>;
      current = leftV.fun(current);
    } else {
      self = rotateAcc(leftV, self.right) as View<unknown, B>;
    }
  }
  return self.fun(current);
}

function rotateAcc<A, B, C>(
  left0: AndThen<A, B>,
  right0: AndThen<B, C>,
): AndThen<A, C> {
  let left: View<A, unknown> = left0 as View<A, B>;
  let right: AndThen<unknown, C> = right0 as AndThen<unknown, C>;

  while (left.tag === 'concat') {
    right = Concat(left.right, right) as AndThen<unknown, C>;
    left = left.left as View<A, unknown>;
  }

  return Concat(left, right);
}
