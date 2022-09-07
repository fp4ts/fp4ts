// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Some } from '../data';
import { Cont, Eval, Memoize, View } from './algebra';

export const evaluate = <A>(e: Eval<A>): A => {
  const stack: unknown[] = [];
  const conts: Cont[] = [];
  let _cur: Eval<unknown> = e;

  runLoop: while (true) {
    const cur = _cur as View<unknown>;
    let result: unknown;

    switch (cur.tag) {
      case 0: // Now
      case 1: // Later
      case 2: // Always
        result = cur.value;
        break;

      case 3: // Defer
        _cur = cur.thunk();
        continue;

      case 4: /* MapK */ {
        const self = cur.self as View<unknown>;
        const f = cur.run;

        switch (self.tag) {
          case 0: // Now
          case 1: // Later
          case 2: // Always
            result = f(self.value);
            break;

          default:
            conts.push(Cont.MapK);
            stack.push(f);
            _cur = self;
            continue;
        }
        break;
      }

      case 5: /* FlatMap */ {
        const self = cur.self as View<unknown>;
        const f = cur.run;

        switch (self.tag) {
          case 0: // Now
          case 1: // Later
          case 2: // Always
            _cur = f(self.value);
            continue;

          default:
            conts.push(Cont.FlatMapK);
            stack.push(f);
            _cur = self;
            continue;
        }
      }

      case 6: // Memoize
        conts.push(Cont.MemoizeK);
        stack.push(cur as any);
        _cur = cur.self;
        continue;
    }

    while (true) {
      if (conts.length <= 0) return result as A;
      const c = conts.pop()!;
      switch (c) {
        case 0: /* MapK */ {
          const next = stack.pop()! as (u: unknown) => unknown;
          result = next(result);
          continue;
        }
        case 1: /* FlatMapK */ {
          const next = stack.pop()! as (u: unknown) => Eval<unknown>;
          _cur = next(result);
          continue runLoop;
        }
        case 2: /* MemoizeK */ {
          const cur = stack.pop()! as any as Memoize<unknown>;
          cur.result = Some(result);
          continue;
        }
      }
    }
  }
};
