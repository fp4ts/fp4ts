// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eval } from '@fp4ts/core';

export class Encoder<O, A> {
  private readonly __void!: void;

  public constructor(public readonly encode: (a: A) => O) {}
}

const SafeEncodeTag = Symbol('@fp4ts/schema/core/safe-eval');
function isSafeEval<O, A>(g: Encoder<O, A>): g is SafeEncoder<O, A> {
  return SafeEncodeTag in g;
}

export function safeEncode<O, A>(g: Encoder<O, A>, x: A): Eval<O> {
  return isSafeEval(g) ? g.safeEncode(x) : Eval.delay(() => g.encode(x));
}

export class SafeEncoder<O, A> extends Encoder<O, A> {
  public readonly [SafeEncodeTag] = true;
  public constructor(public readonly safeEncode: (a: A) => Eval<O>) {
    super(a => safeEncode(a).value);
  }
}
