// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

export function defer<A, B>(fa: () => (a: A) => B): (a: A) => B {
  const apply = ((a: A) => runFunction1(apply, a)) as Defer1<A, B>;
  apply.cached = fa;
  apply[tag] = 0;
  return apply;
}

export function andThen<A, B, C>(fa: (a: A) => B, f: (b: B) => C): (a: A) => C {
  if (!isView(fa) && isView(f)) return compose(f, fa);
  const apply = ((a: A) => runFunction1(apply, a)) as AndThen1<A, B, C>;
  apply.self = fa;
  apply.f = f;
  apply[tag] = 1;
  return apply;
}

export function compose<A, B, C>(fa: (b: B) => C, f: (a: A) => B): (a: A) => C {
  if (!isView(fa) && isView(f)) return andThen(f, fa);
  const apply = ((a: A) => runFunction1(apply, a)) as Compose1<A, B, C>;
  apply.self = fa;
  apply.f = f;
  apply[tag] = 2;
  return apply;
}

export function flatMap<A, B, C>(
  fa: (a: A) => B,
  f: (b: B) => (a: A) => C,
): (a: A) => C {
  const apply = ((a: A) => runFunction1(apply, a)) as FlatMap1<A, B, C>;
  apply.self = fa;
  apply.f = f;
  apply[tag] = 3;
  return apply;
}

const tag = Symbol('@fp4ts/cats/core/function-1');

interface Defer1<A, B> {
  (a: A): B;
  [tag]: 0;
  cached: () => (a: A) => B;
}

interface AndThen1<A, E, B> {
  (a: A): B;
  [tag]: 1;
  self: (a: A) => E;
  f: (e: E) => B;
}

interface Compose1<A, E, B> {
  (a: A): B;
  [tag]: 2;
  self: (e: E) => B;
  f: (a: A) => E;
}

interface FlatMap1<A, E, B> {
  (a: A): B;
  [tag]: 3;
  self: (a: A) => E;
  f: (e: E) => (a: A) => B;
}

type View1<A, B> =
  | Defer1<A, B>
  | AndThen1<A, any, B>
  | Compose1<A, any, B>
  | FlatMap1<A, any, B>;

function isView<A, B>(f: (a: A) => B): f is View1<A, B> {
  return tag in f;
}

function runFunction1<A, B>(fa: (a: A) => B, start: A): B {
  let cur: (u: unknown) => unknown = fa as any;
  let arg: unknown = start;
  const conts: (0 | 1 | 2)[] = [];
  const stack: unknown[] = [];

  let result: unknown | undefined;
  runLoop: while (true) {
    inner: while (true) {
      if (!isView(cur)) {
        result = cur(arg);
        break;
      }
      switch (cur[tag]) {
        case 0:
          cur = cur.cached();
          continue;
        case 1:
          if (!isView(cur.self)) {
            result = cur.f(cur.self(arg));
            break inner;
          } else {
            conts.push(0);
            stack.push(cur.f);
            cur = cur.self;
            continue;
          }

        case 2:
          stack.push(arg);
          conts.push(1);
          arg = cur.f(arg);
          cur = cur.self;
          continue;

        case 3:
          if (!isView(cur.self)) {
            cur = cur.f(cur.self(arg));
          } else {
            conts.push(2);
            stack.push(cur.f);
            cur = cur.self;
          }
          continue;
      }
    }

    while (conts.length !== 0) {
      switch (conts.pop()!) {
        case 0:
          result = (stack.pop()! as (u: unknown) => unknown)(result);
          continue;
        case 1:
          arg = stack.pop()!;
          continue;
        case 2:
          cur = (stack.pop()! as (u: unknown) => (u: unknown) => unknown)(
            result,
          );
          continue runLoop;
      }
    }
    return result as B;
  }
}
