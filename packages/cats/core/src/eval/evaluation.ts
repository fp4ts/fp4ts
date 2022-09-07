// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Some } from '../data';
import { Eval, Memoize, Now, View } from './algebra';

export const evaluate = <A>(e: Eval<A>): A => {
  type Frame = (u: unknown) => Eval<unknown>;
  const stack: Frame[] = [];
  let _cur: Eval<unknown> = e;

  while (true) {
    const cur = _cur as View<unknown>;

    switch (cur.tag) {
      case 0: // Now
      case 1: // Later
      case 2: /* Always */ {
        const a = cur.value;
        if (stack.length <= 0) return a as A;
        const next = stack.pop()!;
        _cur = next(a);
        continue;
      }

      case 3: // Defer
        _cur = cur.thunk();
        continue;

      case 4: /* FlatMap */ {
        const self = cur.self as View<unknown>;
        const f = cur.run;

        switch (self.tag) {
          case 0: // Now
          case 1: // Later
          case 2: // Always
            _cur = f(self.value);
            continue;

          default:
            stack.push(f);
            _cur = self;
            continue;
        }
      }

      case 5: // Memoize
        if (cur.result.isEmpty) {
          stack.push(addToMemo(cur));
          _cur = cur.self;
        } else {
          _cur = new Now(cur.result.get);
        }
        continue;
    }
  }
};

const addToMemo =
  <A1>(m: Memoize<A1>) =>
  (x: A1): Eval<A1> => {
    m.result = Some(x);
    return new Now(x);
  };
