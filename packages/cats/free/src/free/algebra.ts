// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';

export abstract class Free<in out F, out A> {
  private readonly __void!: void;
  private readonly _F!: (f: F) => F;
  private readonly _A!: () => A;
}

export class Pure<F, A> extends Free<F, A> {
  public readonly tag = 0;
  public constructor(public readonly value: A) {
    super();
  }
}

export class Suspend<F, A> extends Free<F, A> {
  public readonly tag = 1;
  public constructor(public readonly fa: Kind<F, [A]>) {
    super();
  }
}

export class FlatMap<F, A, B> extends Free<F, B> {
  public readonly tag = 2;
  public constructor(
    public readonly self: Free<F, A>,
    public readonly f: (a: A) => Free<F, B>,
  ) {
    super();
  }
}

export type View<F, A> = Pure<F, A> | Suspend<F, A> | FlatMap<F, unknown, A>;
