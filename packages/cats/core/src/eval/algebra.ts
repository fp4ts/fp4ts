// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Lazy, lazyVal } from '@fp4ts/core';
import { evaluate } from './evaluation';

export abstract class Eval<out A> {
  private readonly __void!: void;

  public abstract readonly value: A;

  public abstract readonly memoize: Eval<A>;

  public toString(): string {
    return 'Eval(..)';
  }
}

export class Now<A> extends Eval<A> {
  public readonly tag = 0;
  public constructor(public readonly value: A) {
    super();
  }

  public get memoize(): Eval<A> {
    return this;
  }
}

export class Later<A> extends Eval<A> {
  public readonly tag = 1;
  public constructor(thunk: () => A) {
    super();
    this._value = lazyVal(thunk);
  }

  private readonly _value: Lazy<A>;

  public get value(): A {
    return this._value();
  }

  public get memoize(): Eval<A> {
    return this;
  }
}

export class Always<A> extends Eval<A> {
  public readonly tag = 2;
  public constructor(private readonly thunk: () => A) {
    super();
  }

  public get value(): A {
    return this.thunk();
  }

  public get memoize(): Eval<A> {
    return new Later(this.thunk);
  }
}

export class Defer<A> extends Eval<A> {
  public readonly tag = 3;
  public constructor(public readonly thunk: () => Eval<A>) {
    super();
  }

  public get memoize(): Eval<A> {
    return new Memoize(this);
  }

  public get value(): A {
    return evaluate(this);
  }
}

export class Map<E, A> extends Eval<A> {
  public readonly tag = 4;
  public constructor(
    public readonly self: Eval<E>,
    public readonly run: (e: E) => A,
  ) {
    super();
  }

  public get memoize(): Eval<A> {
    return new Memoize(this);
  }

  public get value(): A {
    return evaluate(this);
  }
}

export class FlatMap<E, A> extends Eval<A> {
  public readonly tag = 5;
  public constructor(
    public readonly self: Eval<E>,
    public readonly run: (e: E) => Eval<A>,
  ) {
    super();
  }

  public get memoize(): Eval<A> {
    return new Memoize(this);
  }

  public get value(): A {
    return evaluate(this);
  }
}

export class Memoize<A> extends Eval<A> {
  public readonly tag = 6;
  public readonly result: DeferredValue<A> = {
    resolved: false,
    value: undefined,
  };
  public constructor(public readonly self: Eval<A>) {
    super();
  }

  public readonly memoize = this;
  public get value(): A {
    return this.result.resolved ? this.result.value! : evaluate(this);
  }
}

export interface DeferredValue<A> {
  resolved: boolean;
  value?: A;
}

export type View<A> =
  | Now<A>
  | Later<A>
  | Always<A>
  | Defer<A>
  | Map<any, A>
  | FlatMap<any, A>
  | Memoize<A>;

export enum Cont {
  MapK = 0,
  FlatMapK = 1,
  MemoizeK = 2,
}

export const view = <A>(_: Eval<A>): View<A> => _ as any;
