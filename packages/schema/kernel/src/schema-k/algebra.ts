// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/ban-types */
import { $, Kind } from '@fp4ts/core';
import { ArrayK, ConstK, FunctionK, IdentityK, OptionK } from '@fp4ts/cats';
import { Literal } from '../literal';
import { Schema } from '../schema';
import { SchemableK } from '../schemable-k';
import { ProductK, StructK, SumK } from '../kinds';

export abstract class SchemaK<F> {
  private readonly __void!: void;

  // public abstract toSchema<A>(sa: Schema<A>): Schema<Kind<F, [A]>>;
  public abstract interpret<S>(S: SchemableK<S>): Kind<S, [F]>;
}

export class LiteralSchemaK<A extends [Literal, ...Literal[]]> extends SchemaK<
  $<ConstK, [A[number]]>
> {
  public constructor(private readonly xs: A) {
    super();
  }

  public toSchema<B>(sa: Schema<B>): Schema<A[number]> {
    return Schema.literal(...this.xs);
  }

  public interpret<S>(S: SchemableK<S>): Kind<S, [$<ConstK, [A[number]]>]> {
    return S.literal(...this.xs);
  }
}

export const BooleanSchemaK: SchemaK<$<ConstK, [boolean]>> =
  new (class BooleanSchemaK extends SchemaK<$<ConstK, [boolean]>> {
    public toSchema<A>(sa: Schema<A>): Schema<boolean> {
      return Schema.boolean;
    }

    public interpret<S>(S: SchemableK<S>): Kind<S, [$<ConstK, [boolean]>]> {
      return S.boolean;
    }
  })();
export type BooleanSchemaK = typeof BooleanSchemaK;

export const NumberSchemaK: SchemaK<$<ConstK, [number]>> =
  new (class NumberSchemaK extends SchemaK<$<ConstK, [number]>> {
    public toSchema<A>(sa: Schema<A>): Schema<number> {
      return Schema.number;
    }

    public interpret<S>(S: SchemableK<S>): Kind<S, [$<ConstK, [number]>]> {
      return S.number;
    }
  })();
export type NumberSchemaK = typeof NumberSchemaK;

export const StringSchemaK: SchemaK<$<ConstK, [string]>> =
  new (class StringSchemaK extends SchemaK<$<ConstK, [string]>> {
    public toSchema<A>(sa: Schema<A>): Schema<string> {
      return Schema.string;
    }

    public interpret<S>(S: SchemableK<S>): Kind<S, [$<ConstK, [string]>]> {
      return S.string;
    }
  })();
export type StringSchemaK = typeof StringSchemaK;

export const ParSchemaK: SchemaK<IdentityK> =
  new (class ParSchemaK extends SchemaK<IdentityK> {
    public toSchema<A>(sa: Schema<A>): Schema<A> {
      return sa;
    }

    public interpret<S>(S: SchemableK<S>): Kind<S, [IdentityK]> {
      return S.par;
    }
  })();
export type ParSchemaK = typeof ParSchemaK;

export class ArraySchemaK<F> extends SchemaK<[ArrayK, F]> {
  public constructor(private readonly sf: SchemaK<F>) {
    super();
  }

  public interpret<S>(S: SchemableK<S>): Kind<S, [[ArrayK, F]]> {
    return S.array(this.sf.interpret(S));
  }
}

export class OptionalSchemaK<F> extends SchemaK<[OptionK, F]> {
  public constructor(private readonly sf: SchemaK<F>) {
    super();
  }

  public interpret<S>(S: SchemableK<S>): Kind<S, [[OptionK, F]]> {
    return S.optional(this.sf.interpret(S));
  }
}

export class StructSchemaK<F extends {}> extends SchemaK<StructK<F>> {
  public constructor(private readonly fs: { [k in keyof F]: SchemaK<F[k]> }) {
    super();
  }

  // public toSchema<A>(sa: Schema<A>): Schema<Kind<StructK<F>, [A]>> {
  //   const keys = Object.keys(this.fs) as (keyof F)[];
  //   const ss = keys.reduce(
  //     (acc, k) => ({ ...acc, [k]: this.fs[k].toSchema(sa) }),
  //     {} as Partial<{ [k in keyof F]: Schema<Kind<F[k], [A]>> }>,
  //   );
  //   return Schema.struct<Kind<StructK<F>, [A]>>(
  //     ss as { [k in keyof F]: Schema<Kind<F[k], [A]>> },
  //   );
  // }

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

  // public toSchema<A>(sa: Schema<A>): Schema<Kind<ProductK<F>, [A]>> {
  //   const ss = this.fs.map(f => f.toSchema(sa)) as {
  //     [k in keyof F]: Schema<Kind<F[k], [A]>>;
  //   };
  //   return Schema.product(...(ss as any));
  // }

  public interpret<S>(S: SchemableK<S>): Kind<S, [ProductK<F>]> {
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

  // public toSchema<A>(sa: Schema<A>): Schema<Kind<SumK<F[keyof F]>, [A]>> {
  //   const keys = Object.keys(this.fs) as (keyof F)[];
  //   const ss = keys.reduce(
  //     (acc, k) => ({ ...acc, [k]: this.fs[k].toSchema(sa) }),
  //     {} as Partial<{ [k in keyof F]: Schema<Kind<F[k], [A]>> }>,
  //   );
  //   return Schema.sum(this.tag)(ss as any) as any;
  // }

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

  // public toSchema<A>(sa: Schema<A>): Schema<Kind<F, [A]>> {
  //   return Schema.defer(() => this.thunk().toSchema(sa));
  // }

  public interpret<S>(S: SchemableK<S>): Kind<S, [F]> {
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

  // public toSchema<A>(sa: Schema<A>): Schema<Kind<G, [A]>> {
  //   return this.sf.toSchema(sa).imap(this.f, this.g);
  // }

  public interpret<S>(S: SchemableK<S>): Kind<S, [G]> {
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

  // public toSchema<A>(sa: Schema<A>): Schema<Kind<F, [Kind<G, [A]>]>> {
  //   return this.sf.toSchema(this.sg.toSchema(sa));
  // }

  public interpret<S>(S: SchemableK<S>): Kind<S, [[F, G]]> {
    return S.compose_(this.sf.interpret(S), this.sg.interpret(S));
  }
}
