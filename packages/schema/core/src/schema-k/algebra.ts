// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/ban-types */
import { $, Kind } from '@fp4ts/core';
import { ConstK, IdentityK } from '@fp4ts/cats';
import { Literal } from '@fp4ts/schema-kernel';
import { SchemableK } from '../schemable-k';
import { ProductK, StructK, SumK } from '../kinds';

export abstract class SchemaK<F> {
  private readonly __void!: void;

  public abstract interpret<S>(S: SchemableK<S>): Kind<S, [F]>;
}

export class LiteralSchemaK<A extends [Literal, ...Literal[]]> extends SchemaK<
  $<ConstK, [A[number]]>
> {
  public constructor(private readonly xs: A) {
    super();
  }

  public interpret<S>(S: SchemableK<S>): Kind<S, [$<ConstK, [A[number]]>]> {
    return S.literal(...this.xs);
  }
}

export const BooleanSchemaK: SchemaK<$<ConstK, [boolean]>> =
  new (class BooleanSchemaK extends SchemaK<$<ConstK, [boolean]>> {
    public interpret<S>(S: SchemableK<S>): Kind<S, [$<ConstK, [boolean]>]> {
      return S.boolean;
    }
  })();
export type BooleanSchemaK = typeof BooleanSchemaK;

export const NumberSchemaK: SchemaK<$<ConstK, [number]>> =
  new (class NumberSchemaK extends SchemaK<$<ConstK, [number]>> {
    public interpret<S>(S: SchemableK<S>): Kind<S, [$<ConstK, [number]>]> {
      return S.number;
    }
  })();
export type NumberSchemaK = typeof NumberSchemaK;

export const StringSchemaK: SchemaK<$<ConstK, [string]>> =
  new (class StringSchemaK extends SchemaK<$<ConstK, [string]>> {
    public interpret<S>(S: SchemableK<S>): Kind<S, [$<ConstK, [string]>]> {
      return S.string;
    }
  })();
export type StringSchemaK = typeof StringSchemaK;

export const ParSchemaK: SchemaK<IdentityK> =
  new (class ParSchemaK extends SchemaK<IdentityK> {
    public interpret<S>(S: SchemableK<S>): Kind<S, [IdentityK]> {
      return S.par;
    }
  })();
export type ParSchemaK = typeof ParSchemaK;

export class StructSchemaK<F extends {}> extends SchemaK<StructK<F>> {
  public constructor(private readonly fs: { [k in keyof F]: SchemaK<F[k]> }) {
    super();
  }

  public interpret<S>(S: SchemableK<S>): Kind<S, [StructK<F>]> {
    const keys = Object.keys(this.fs) as (keyof F)[];
    const ss = keys.reduce(
      (acc, k) => ({ ...acc, [k]: this.fs[k].interpret(S) }),
      {} as Partial<{ [k in keyof F]: Kind<S, [F[k]]> }>,
    );
    return S.struct(ss as { [k in keyof F]: Kind<S, [F[k]]> });
  }
}

export class ProductSchemaK<F extends unknown[]> extends SchemaK<ProductK<F>> {
  public constructor(private readonly fs: { [k in keyof F]: SchemaK<F[k]> }) {
    super();
  }

  public interpret<S>(S: SchemableK<S>): Kind<S, [ProductK<F>]> {
    const ss = this.fs.map(f => f.interpret(S)) as {
      [k in keyof F]: Kind<S, [F[k]]>;
    };
    return S.product(...ss);
  }
}

export class SumSchemaK<T extends string, F extends {}> extends SchemaK<
  SumK<F[keyof F]>
> {
  public constructor(
    private readonly tag: T,
    private readonly fs: { [k in keyof F]: SchemaK<F[k]> },
  ) {
    super();
  }

  public interpret<S>(S: SchemableK<S>): Kind<S, [SumK<F[keyof F]>]> {
    const keys = Object.keys(this.fs) as (keyof F)[];
    const ss = keys.reduce(
      (acc, k) => ({ ...acc, [k]: this.fs[k].interpret(S) }),
      {} as Partial<{ [k in keyof F]: Kind<S, [F[k]]> }>,
    );
    return S.sum(this.tag)(ss as { [k in keyof F]: Kind<S, [F[k]]> });
  }
}

export class DeferSchemaK<F> extends SchemaK<F> {
  public constructor(public readonly thunk: () => SchemaK<F>) {
    super();
  }

  public interpret<S>(S: SchemableK<S>): Kind<S, [F]> {
    return S.defer(() => this.thunk().interpret(S));
  }
}
