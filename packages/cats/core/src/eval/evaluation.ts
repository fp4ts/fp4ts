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

  const addToMemo =
    <A1>(m: Memoize<A1>) =>
    (x: A1): Eval<A1> => {
      m.result = Some(x);
      return new Now(x);
    };

  while (true) {
    const cur = _cur as View<unknown>;

    switch (cur.tag) {
      case 0: // 'now'
      case 1: // 'later'
      case 2: /* 'always' */ {
        const a = cur.value;
        if (stack.length <= 0) return a as A;
        const next = stack.pop()!;
        _cur = next(a);
        continue;
      }

      case 3: // 'defer'
        _cur = cur.thunk();
        continue;

      case 4: /* 'flatMap' */ {
        const self = cur.self as View<unknown>;
        const f = cur.run;

        switch (self.tag) {
          case 0: // 'now'
          case 1: // 'later'
          case 2: // 'always'
            _cur = f(self.value);
            continue;

          default:
            stack.push(f);
            _cur = self;
            continue;
        }
      }

      case 5: /* 'memoize' */ {
        const m = cur;
        m.result.fold(
          () => {
            _cur = m.self;
            stack.push(addToMemo(m));
          },
          x => {
            _cur = new Now(x);
          },
        );
        continue;
      }
    }
  }
};
