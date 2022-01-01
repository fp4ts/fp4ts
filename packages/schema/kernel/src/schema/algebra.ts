/* eslint-disable @typescript-eslint/ban-types */
import { Kind } from '@fp4ts/core';
import { Literal } from '../literal';
import { Schemable } from '../schemable';

export abstract class Schema<A> {
  public abstract interpret<S>(S: Schemable<S>): Kind<S, [A]>;
}

export class LiteralSchema<A extends [Literal, ...Literal[]]> extends Schema<
  A[number]
> {
  public constructor(private readonly xs: A) {
    super();
  }

  public interpret<S>(S: Schemable<S>): Kind<S, [A[number]]> {
    return S.literal(...this.xs);
  }
}

export const BooleanSchema = new (class BooleanSchema extends Schema<boolean> {
  public interpret<S>(S: Schemable<S>): Kind<S, [boolean]> {
    return S.boolean;
  }
})();
export type BooleanSchema = typeof BooleanSchema;

export const NumberSchema = new (class NumberSchema extends Schema<number> {
  public interpret<S>(S: Schemable<S>): Kind<S, [number]> {
    return S.number;
  }
})();
export type NumberSchema = typeof NumberSchema;

export const StringSchema = new (class StringSchema extends Schema<string> {
  public interpret<S>(S: Schemable<S>): Kind<S, [string]> {
    return S.string;
  }
})();
export type StringSchema = typeof StringSchema;

export const NullSchema = new (class NullSchema extends Schema<null> {
  public interpret<S>(S: Schemable<S>): Kind<S, [null]> {
    return S.null;
  }
})();
export type NullSchema = typeof NullSchema;

export class ArraySchema<A> extends Schema<A[]> {
  public constructor(private readonly sa: Schema<A>) {
    super();
  }

  public interpret<S>(S: Schemable<S>): Kind<S, [A[]]> {
    return S.array(this.sa.interpret(S));
  }
}

export class StructSchema<A extends {}> extends Schema<A> {
  public constructor(private readonly xs: { [k in keyof A]: Schema<A[k]> }) {
    super();
  }

  public interpret<S>(S: Schemable<S>): Kind<S, [A]> {
    const keys = Object.keys(this.xs) as (keyof A)[];
    const sxs = keys.reduce(
      (acc, k) => ({ ...acc, [k]: this.xs[k].interpret(S) }),
      {} as { [k in keyof A]: Kind<S, [A[k]]> },
    );
    return S.struct(sxs);
  }
}

export class PartialSchema<A extends {}> extends Schema<Partial<A>> {
  public constructor(private readonly xs: { [k in keyof A]: Schema<A[k]> }) {
    super();
  }

  public interpret<S>(S: Schemable<S>): Kind<S, [Partial<A>]> {
    const keys = Object.keys(this.xs) as (keyof A)[];
    const sxs = keys.reduce(
      (acc, k) => ({ ...acc, [k]: this.xs[k].interpret(S) }),
      {} as { [k in keyof A]: Kind<S, [A[k]]> },
    );
    return S.partial(sxs);
  }
}

export class RecordSchema<A> extends Schema<Record<string, A>> {
  public constructor(private readonly sa: Schema<A>) {
    super();
  }

  public interpret<S>(S: Schemable<S>): Kind<S, [Record<string, A>]> {
    return S.record(this.sa.interpret(S));
  }
}

export class NullableSchema<A> extends Schema<A | null> {
  public constructor(private readonly sa: Schema<A>) {
    super();
  }

  public interpret<S>(S: Schemable<S>): Kind<S, [A | null]> {
    return S.nullable(this.sa.interpret(S));
  }
}

export class UnionSchema<A, B> extends Schema<A | B> {
  public constructor(
    private readonly sa: Schema<A>,
    private readonly sb: Schema<B>,
  ) {
    super();
  }

  public interpret<S>(S: Schemable<S>): Kind<S, [A | B]> {
    return S.union(this.sa.interpret(S), this.sb.interpret(S));
  }
}

export class IntersectionSchema<A, B> extends Schema<A & B> {
  public constructor(
    private readonly sa: Schema<A>,
    private readonly sb: Schema<B>,
  ) {
    super();
  }

  public interpret<S>(S: Schemable<S>): Kind<S, [A & B]> {
    return S.intersection(this.sa.interpret(S), this.sb.interpret(S));
  }
}

export class ProductSchema<A extends unknown[]> extends Schema<A> {
  public constructor(private readonly xs: { [k in keyof A]: Schema<A> }) {
    super();
  }

  public interpret<S>(S: Schemable<S>): Kind<S, [A]> {
    const sxs = this.xs.map(sa => sa.interpret(S));
    return S.product(...sxs);
  }
}

export class SumSchema<T extends string, A extends {}> extends Schema<
  A[keyof A]
> {
  public constructor(
    private readonly tag: T,
    private readonly xs: { [k in keyof A]: Schema<A[k] & Record<T, k>> },
  ) {
    super();
  }

  public interpret<S>(S: Schemable<S>): Kind<S, [A[keyof A]]> {
    const keys = Object.keys(this.xs) as (keyof A)[];
    const sxs = keys.reduce(
      (acc, k) => ({ ...acc, [k]: this.xs[k].interpret(S) }),
      {} as { [k in keyof A]: Kind<S, [A[k] & Record<T, k>]> },
    );
    return S.sum(this.tag)(sxs);
  }
}

export class DeferSchema<A> extends Schema<A> {
  public constructor(private readonly thunk: () => Schema<A>) {
    super();
  }

  public interpret<S>(S: Schemable<S>): Kind<S, [A]> {
    return S.defer(() => this.thunk().interpret(S));
  }
}
