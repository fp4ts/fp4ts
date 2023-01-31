// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

export function defer<A>(fa: () => () => A): () => A {
  const apply = (() => runFunction0(apply)) as Defer0<A>;
  apply.cached = fa;
  apply[tag] = 0;
  return apply;
}

export function map<A, B>(fa: () => A, f: (a: A) => B): () => B {
  const apply = (() => runFunction0(apply)) as Map0<A, B>;
  apply.self = fa;
  apply.f = f;
  apply[tag] = 1;
  return apply;
}

export function flatMap<A, B>(fa: () => A, f: (a: A) => () => B): () => B {
  const apply = (() => runFunction0(apply)) as FlatMap0<A, B>;
  apply.self = fa;
  apply.f = f;
  apply[tag] = 2;
  return apply;
}

const tag = Symbol('@fp4ts/cats/core/function-0');

interface Defer0<A> {
  (): A;
  [tag]: 0;
  cached: () => () => A;
}

interface Map0<E, A> {
  (): A;
  [tag]: 1;
  self: () => E;
  f: (e: E) => A;
}

interface FlatMap0<E, A> {
  (): A;
  [tag]: 2;
  self: () => E;
  f: (e: E) => () => A;
}

type View0<A> = Defer0<A> | Map0<any, A> | FlatMap0<any, A>;

function isView<A>(f: () => A): f is View0<A> {
  return tag in f;
}

function runFunction0<A>(fa: () => A): A {
  type Cont = 0 /* Map */ | 1 /* FlatMap */;
  type Frame = (u: any) => unknown;
  let cur: () => unknown = fa;
  const conts: Cont[] = [];
  const stack: Frame[] = [];

  let result: unknown | undefined;
  runLoop: while (true) {
    inner: while (true) {
      if (!isView(cur)) {
        result = cur();
        break;
      }
      switch (cur[tag]) {
        case 0:
          cur = cur.cached();
          continue;
        case 1:
          if (!isView(cur.self)) {
            result = cur.f(cur.self());
            break inner;
          } else {
            conts.push(0);
            stack.push(cur.f);
            cur = cur.self;
            continue;
          }
        case 2:
          if (!isView(cur.self)) {
            cur = cur.f(cur.self());
          } else {
            conts.push(1);
            stack.push(cur.f);
            cur = cur.self;
          }
          continue;
      }
    }

    while (conts.length !== 0) {
      switch (conts.pop()!) {
        case 0:
          result = stack.pop()!(result);
          continue;
        case 1:
          cur = stack.pop()!(result) as () => unknown;
          continue runLoop;
      }
    }
    return result as A;
  }
}
