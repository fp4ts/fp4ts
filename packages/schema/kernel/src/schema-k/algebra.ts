// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/ban-types */
import { $, Kind } from '@fp4ts/core';
import {
  ArrayF,
  ConstF,
  FunctionK,
  IdentityF,
  Option,
  OptionF,
} from '@fp4ts/cats';
import { Literal } from '../literal';
import { Schema } from '../schema';
import { SchemableK } from '../schemable-k';
import { ProductK, StructK, SumK } from '../kinds';

export abstract class SchemaK<F> {
  private readonly cache = new Map<SchemableK<any>, any>();
  private readonly schemaCache = new Map<Schema<any>, Schema<any>>();
  private readonly __void!: void;

  public toSchema<A>(sa: Schema<A>): Schema<Kind<F, [A]>> {
    if (this.schemaCache.has(sa)) {
      return this.schemaCache.get(sa)!;
    }
    const sfa = this.toSchema0(sa);
    this.schemaCache.set(sa, sfa);
    return sfa;
  }

  protected abstract toSchema0<A>(sa: Schema<A>): Schema<Kind<F, [A]>>;

  public interpret<S>(S: SchemableK<S>): Kind<S, [F]> {
    if (this.cache.has(S)) {
      return this.cache.get(S)!;
    }
    const SF = this.interpret0(S);
    this.cache.set(S, SF);
    return SF;
  }
  protected abstract interpret0<S>(S: SchemableK<S>): Kind<S, [F]>;
}

export class LiteralSchemaK<A extends [Literal, ...Literal[]]> extends SchemaK<
  $<ConstF, [A[number]]>
> {
  public constructor(private readonly xs: A) {
    super();
  }

  public toSchema0<B>(sa: Schema<B>): Schema<A[number]> {
    return Schema.literal(...this.xs);
  }

  protected interpret0<S>(S: SchemableK<S>): Kind<S, [$<ConstF, [A[number]]>]> {
    return S.literal(...this.xs);
  }
}

export const BooleanSchemaK: SchemaK<$<ConstF, [boolean]>> =
  new (class BooleanSchemaK extends SchemaK<$<ConstF, [boolean]>> {
    protected toSchema0<A>(sa: Schema<A>): Schema<boolean> {
      return Schema.boolean;
    }

    protected interpret0<S>(S: SchemableK<S>): Kind<S, [$<ConstF, [boolean]>]> {
      return S.boolean;
    }
  })();
export type BooleanSchemaK = typeof BooleanSchemaK;

export const NumberSchemaK: SchemaK<$<ConstF, [number]>> =
  new (class NumberSchemaK extends SchemaK<$<ConstF, [number]>> {
    protected toSchema0<A>(sa: Schema<A>): Schema<number> {
      return Schema.number;
    }

    protected interpret0<S>(S: SchemableK<S>): Kind<S, [$<ConstF, [number]>]> {
      return S.number;
    }
  })();
export type NumberSchemaK = typeof NumberSchemaK;

export const StringSchemaK: SchemaK<$<ConstF, [string]>> =
  new (class StringSchemaK extends SchemaK<$<ConstF, [string]>> {
    protected toSchema0<A>(sa: Schema<A>): Schema<string> {
      return Schema.string;
    }

    protected interpret0<S>(S: SchemableK<S>): Kind<S, [$<ConstF, [string]>]> {
      return S.string;
    }
  })();
export type StringSchemaK = typeof StringSchemaK;

export const ParSchemaK: SchemaK<IdentityF> =
  new (class ParSchemaK extends SchemaK<IdentityF> {
    protected toSchema0<A>(sa: Schema<A>): Schema<A> {
      return sa;
    }

    protected interpret0<S>(S: SchemableK<S>): Kind<S, [IdentityF]> {
      return S.par;
    }
  })();
export type ParSchemaK = typeof ParSchemaK;

export class ArraySchemaK<F> extends SchemaK<[ArrayF, F]> {
  public constructor(private readonly sf: SchemaK<F>) {
    super();
  }

  protected toSchema0<A>(sa: Schema<A>): Schema<Kind<F, [A]>[]> {
    return this.sf.toSchema(sa).array;
  }

  protected interpret0<S>(S: SchemableK<S>): Kind<S, [[ArrayF, F]]> {
    return S.array(this.sf.interpret(S));
  }
}

export class OptionalSchemaK<F> extends SchemaK<[OptionF, F]> {
  public constructor(private readonly sf: SchemaK<F>) {
    super();
  }

  protected toSchema0<A>(sa: Schema<A>): Schema<Option<Kind<F, [A]>>> {
    return this.sf.toSchema(sa).optional;
  }

  protected interpret0<S>(S: SchemableK<S>): Kind<S, [[OptionF, F]]> {
    return S.optional(this.sf.interpret(S));
  }
}

export class StructSchemaK<F extends {}> extends SchemaK<StructK<F>> {
  public constructor(private readonly fs: { [k in keyof F]: SchemaK<F[k]> }) {
    super();
  }

  protected toSchema0<A>(sa: Schema<A>): Schema<Kind<StructK<F>, [A]>> {
    const keys = Object.keys(this.fs) as (keyof F)[];
    const ss = keys.reduce(
      (acc, k) => ({ ...acc, [k]: this.fs[k].toSchema(sa) }),
      {} as Partial<{ [k in keyof F]: Schema<Kind<F[k], [A]>> }>,
    );
    return Schema.struct<Kind<StructK<F>, [A]>>(
      ss as { [k in keyof F]: Schema<Kind<F[k], [A]>> },
    );
  }

  protected interpret0<S>(S: SchemableK<S>): Kind<S, [StructK<F>]> {
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

  protected toSchema0<A>(sa: Schema<A>): Schema<Kind<ProductK<F>, [A]>> {
    const ss = this.fs.map(f => f.toSchema(sa)) as {
      [k in keyof F]: Schema<Kind<F[k], [A]>>;
    };
    return Schema.product(...(ss as any));
  }

  protected interpret0<S>(S: SchemableK<S>): Kind<S, [ProductK<F>]> {
    const ss = this.fs.map(f => f.interpret(S)) as {
      [k in keyof F]: Kind<S, [F[k]]>;
    };
    return S.product(...ss);
  }
}

export class SumSchemaK<T extends string, F extends {}> extends SchemaK<
  SumK<F>
> {
  public constructor(
    private readonly tag: T,
    private readonly fs: { [k in keyof F]: SchemaK<F[k]> },
  ) {
    super();
  }

  protected toSchema0<A>(sa: Schema<A>): Schema<Kind<SumK<F>, [A]>> {
    const keys = Object.keys(this.fs) as (keyof F)[];
    const ss = keys.reduce(
      (acc, k) => ({ ...acc, [k]: this.fs[k].toSchema(sa) }),
      {} as Partial<{ [k in keyof F]: Schema<Kind<F[k], [A]>> }>,
    );
    return Schema.sum(this.tag)(ss as any) as any;
  }

  protected interpret0<S>(S: SchemableK<S>): Kind<S, [SumK<F>]> {
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

  protected toSchema0<A>(sa: Schema<A>): Schema<Kind<F, [A]>> {
    return Schema.defer(() => this.thunk().toSchema(sa));
  }

  protected interpret0<S>(S: SchemableK<S>): Kind<S, [F]> {
    return S.defer(() => this.thunk().interpret(S));
  }
}

export class ImapSchemaK<F, G> extends SchemaK<G> {
  public constructor(
    private readonly sf: SchemaK<F>,
    private readonly f: FunctionK<F, G>,
    private readonly g: FunctionK<G, F>,
  ) {
    super();
  }

  protected toSchema0<A>(sa: Schema<A>): Schema<Kind<G, [A]>> {
    return this.sf.toSchema(sa).imap(this.f, this.g);
  }

  protected interpret0<S>(S: SchemableK<S>): Kind<S, [G]> {
    return S.imap_(this.sf.interpret(S), this.f, this.g);
  }
}

export class ComposeSchemaK<F, G> extends SchemaK<[F, G]> {
  public constructor(
    private readonly sf: SchemaK<F>,
    private readonly sg: SchemaK<G>,
  ) {
    super();
  }

  protected toSchema0<A>(sa: Schema<A>): Schema<Kind<F, [Kind<G, [A]>]>> {
    return this.sf.toSchema(this.sg.toSchema(sa));
  }

  protected interpret0<S>(S: SchemableK<S>): Kind<S, [[F, G]]> {
    return S.compose_(this.sf.interpret(S), this.sg.interpret(S));
  }
}
