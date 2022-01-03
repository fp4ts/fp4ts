// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { tailrec } from '@fp4ts/core';
import { AndThen, Concat, view, View } from './algebra';

export const runLoop_ = <A, B>(f: AndThen<A, B>, start: A): B => {
  const loop = tailrec(<X>(self: View<X, B>, current: X): B => {
    if (self.tag === 'single') return self.fun(current);

    const leftV = view(self.left);
    return leftV.tag === 'single'
      ? loop(view(self.right), leftV.fun(current))
      : loop(view(rotateAcc(leftV, self.right)), current);
  });

  return loop(view(f), start);
};

const rotateAcc = <A, B, C>(
  left0: AndThen<A, B>,
  right0: AndThen<B, C>,
): AndThen<A, C> => {
  const loop = tailrec(
    <X>(left: View<A, X>, right: AndThen<X, C>): AndThen<A, C> =>
      left.tag === 'concat'
        ? loop(view(left.left), new Concat(left.right, right))
        : new Concat(left, right),
  );
  return loop(view(left0), right0);
};
