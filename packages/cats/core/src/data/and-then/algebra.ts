// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

const AndThenTag = Symbol('@fp4ts/cats/core/and-then');

export abstract class AndThen<in A, out B> {
  private readonly __void!: void;
}
export interface AndThen<A, B> {
  (a: A): B;
}

export interface Single<A, B> extends AndThen<A, B> {
  readonly tag: 'single';
  readonly fun: (a: A) => B;
  readonly idx: number;
}

export function Single<A, B>(fun: (a: A) => B, idx: number): Single<A, B> {
  const apply = function (this: AndThen<A, B>, a: A): B {
    return runLoop_(apply as any, a);
  };

  (apply as any)[AndThenTag] = true;
  (apply as any).tag = 'single';
  (apply as any).fun = fun;
  (apply as any).idx = idx;
  (apply as any).andThen = AndThen.prototype.andThen;
  (apply as any).compose = AndThen.prototype.compose;
  return apply as any;
}

export interface Concat<A, E, B> extends AndThen<A, B> {
  readonly tag: 'concat';
  readonly left: AndThen<A, E>;
  readonly right: AndThen<E, B>;
}

export function Concat<A, E, B>(
  left: AndThen<A, E>,
  right: AndThen<E, B>,
): Concat<A, E, B> {
  const apply = function (this: AndThen<A, B>, a: A): B {
    return runLoop_(apply as any, a);
  };

  (apply as any)[AndThenTag] = true;
  (apply as any).tag = 'concat';
  (apply as any).left = left;
  (apply as any).right = right;
  (apply as any).andThen = AndThen.prototype.andThen;
  (apply as any).compose = AndThen.prototype.compose;
  return apply as any;
}

export function isAndThen<A, B>(f: (a: A) => B): f is AndThen<A, B> {
  return AndThenTag in f;
}

export type View<A, B> = Single<A, B> | Concat<A, any, B>;
export const view = <A, B>(_: AndThen<A, B>): View<A, B> => _ as any;

function runLoop_<A, B>(f: AndThen<A, B>, start: A): B {
  let current: unknown = start;
  let self: View<unknown, unknown> = f as View<unknown, unknown>;
  const stack: AndThen<unknown, unknown>[] = [];

  while (true) {
    while (self.tag !== 'single') {
      const leftV = self.left as View<unknown, unknown>;
      const rightV = self.right as View<unknown, unknown>;

      if (leftV.tag === 'single') {
        self = rightV as View<unknown, unknown>;
        current = leftV.fun(current);
      } else {
        stack.push(rightV);
        self = leftV;
      }
    }

    current = self.fun(current);
    if (stack.length === 0) return current as B;
    self = stack.pop()! as View<unknown, unknown>;
  }
}
