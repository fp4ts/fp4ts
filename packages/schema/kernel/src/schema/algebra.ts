// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/ban-types */
import { Kind } from '@fp4ts/core';
import { Literal } from '../literal';
import { Schemable } from '../schemable';

export abstract class Schema<A> {
  private readonly cache = new Map<Schemable<any>, any>();
  public interpret<S>(S: Schemable<S>): Kind<S, [A]> {
    if (this.cache.has(S)) {
      return this.cache.get(S)!;
    }
    const SA = this.interpret0(S);
    this.cache.set(S, SA);
    return SA;
  }
  protected abstract interpret0<S>(S: Schemable<S>): Kind<S, [A]>;
}

export class LiteralSchema<A extends [Literal, ...Literal[]]> extends Schema<
  A[number]
> {
  public constructor(private readonly xs: A) {
    super();
  }

  protected interpret0<S>(S: Schemable<S>): Kind<S, [A[number]]> {
    return S.literal(...this.xs);
  }
}

export const BooleanSchema: Schema<boolean> =
  new (class BooleanSchema extends Schema<boolean> {
    protected interpret0<S>(S: Schemable<S>): Kind<S, [boolean]> {
      return S.boolean;
    }
  })();
export type BooleanSchema = typeof BooleanSchema;

export const NumberSchema: Schema<number> =
  new (class NumberSchema extends Schema<number> {
    protected interpret0<S>(S: Schemable<S>): Kind<S, [number]> {
      return S.number;
    }
  })();
export type NumberSchema = typeof NumberSchema;

export const StringSchema: Schema<string> =
  new (class StringSchema extends Schema<string> {
    protected interpret0<S>(S: Schemable<S>): Kind<S, [string]> {
      return S.string;
    }
  })();
export type StringSchema = typeof StringSchema;

export const NullSchema: Schema<null> =
  new (class NullSchema extends Schema<null> {
    protected interpret0<S>(S: Schemable<S>): Kind<S, [null]> {
      return S.null;
    }
  })();
export type NullSchema = typeof NullSchema;

export class ArraySchema<A> extends Schema<A[]> {
  public constructor(private readonly sa: Schema<A>) {
    super();
  }

  protected interpret0<S>(S: Schemable<S>): Kind<S, [A[]]> {
    return S.array(this.sa.interpret(S));
  }
}

export class StructSchema<A extends {}> extends Schema<A> {
  public constructor(public readonly struct: { [k in keyof A]: Schema<A[k]> }) {
    super();
  }

  protected interpret0<S>(S: Schemable<S>): Kind<S, [A]> {
    const keys = Object.keys(this.struct) as (keyof A)[];
    const sxs = keys.reduce(
      (acc, k) => ({ ...acc, [k]: this.struct[k].interpret(S) }),
      {} as { [k in keyof A]: Kind<S, [A[k]]> },
    );
    return S.struct(sxs);
  }
}

export class RecordSchema<A> extends Schema<Record<string, A>> {
  public constructor(private readonly sa: Schema<A>) {
    super();
  }

  protected interpret0<S>(S: Schemable<S>): Kind<S, [Record<string, A>]> {
    return S.record(this.sa.interpret(S));
  }
}

export class NullableSchema<A> extends Schema<A | null> {
  public constructor(private readonly sa: Schema<A>) {
    super();
  }

  protected interpret0<S>(S: Schemable<S>): Kind<S, [A | null]> {
    return S.nullable(this.sa.interpret(S));
  }
}

export class NonRequiredSchema<A> extends Schema<A | undefined> {
  public constructor(private readonly sa: Schema<A>) {
    super();
  }

  protected interpret0<S>(S: Schemable<S>): Kind<S, [A | undefined]> {
    return S.optional(this.sa.interpret(S));
  }
}

export class ProductSchema<A extends unknown[]> extends Schema<A> {
  public constructor(private readonly xs: { [k in keyof A]: Schema<A[k]> }) {
    super();
  }

  protected interpret0<S>(S: Schemable<S>): Kind<S, [A]> {
    const sxs = this.xs.map(sa => sa.interpret(S));
    return S.product<A>(...(sxs as { [k in keyof A]: Kind<S, [A[k]]> }));
  }
}

export class SumSchema<T extends string, A extends {}> extends Schema<
  A[keyof A]
> {
  public constructor(
    public readonly tag: T,
    public readonly sum: { [k in keyof A]: Schema<A[k] & Record<T, k>> },
  ) {
    super();
  }

  protected interpret0<S>(S: Schemable<S>): Kind<S, [A[keyof A]]> {
    const keys = Object.keys(this.sum) as (keyof A)[];
    const sxs = keys.reduce(
      (acc, k) => ({ ...acc, [k]: this.sum[k].interpret(S) }),
      {} as { [k in keyof A]: Kind<S, [A[k] & Record<T, k>]> },
    );
    return S.sum(this.tag)(sxs);
  }
}

export class DeferSchema<A> extends Schema<A> {
  public constructor(private readonly thunk: () => Schema<A>) {
    super();
  }

  protected interpret0<S>(S: Schemable<S>): Kind<S, [A]> {
    return S.defer(() => this.thunk().interpret(S));
  }
}

export class ImapSchema<A, B> extends Schema<B> {
  public constructor(
    public readonly sa: Schema<A>,
    public readonly f: (a: A) => B,
    public readonly g: (b: B) => A,
  ) {
    super();
  }

  protected interpret0<S>(S: Schemable<S>): Kind<S, [B]> {
    return S.imap(this.sa.interpret(S), this.f, this.g);
  }
}

export class MakeSchema<A> extends Schema<A> {
  public constructor(
    public readonly make: <S>(S: Schemable<S>) => Kind<S, [A]>,
  ) {
    super();
  }

  protected interpret0<S>(S: Schemable<S>): Kind<S, [A]> {
    return this.make(S);
  }
}
