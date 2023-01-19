// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eval } from '@fp4ts/core';

export class Guard<I, A extends I> {
  private readonly __void!: void;

  public constructor(public readonly test: (i: I) => i is A) {}
}

const SafeGuardTag = Symbol('@fp4ts/schema/core/safe-guard');
function isSafeGuard<I, A extends I>(g: Guard<I, A>): g is SafeGuard<I, A> {
  return SafeGuardTag in g;
}

export function safeTest<I, A extends I>(g: Guard<I, A>, x: I): Eval<boolean> {
  return isSafeGuard(g) ? g.safeTest(x) : Eval.delay(() => g.test(x));
}

export class SafeGuard<I, A extends I> extends Guard<I, A> {
  public readonly [SafeGuardTag] = true;
  public constructor(public readonly safeTest: (i: I) => Eval<boolean>) {
    super((i): i is A => safeTest(i).value);
  }
}
