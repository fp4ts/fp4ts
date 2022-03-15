// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/ban-types */
import { Kind, Lazy, lazyVal } from '@fp4ts/core';
import {
  Array,
  Const,
  Eq,
  EqK,
  EqKF,
  Eval,
  FunctionK,
  Identity,
} from '@fp4ts/cats';
import { SchemableK } from './schemable-k';
import { NullableK, ProductK, StructK, SumK } from './kinds';
import {
  deferSafeEq,
  imapSafeEq,
  productSafeEq,
  SafeEq,
  safeEquals,
  structSafeEq,
  sumSafeEq,
} from './eq';

export const eqKSchemableK: Lazy<SchemableK<EqKF>> = lazyVal(() =>
  SchemableK.of({
    boolean: Const.EqK(Eq.fromUniversalEquals<boolean>()),
    number: Const.EqK(Eq.fromUniversalEquals<number>()),
    string: Const.EqK(Eq.fromUniversalEquals<string>()),
    null: Const.EqK(Eq.fromUniversalEquals<null>()),
    literal: lazyVal(() => Const.EqK(Eq.fromUniversalEquals<any>())),
    array: f => EqK.compose(Array.EqK(), f),
    nullable: f => new NullableSafeEqK(f),

    compose_: EqK.compose,
    imap_: (fa, f, g) => new ImapSafeEqK(fa, f, g),

    par: Identity.EqK,

    product: (<F extends unknown[]>(...fs: { [k in keyof F]: EqK<F[k]> }) =>
      new ProductSafeEqK<F>(fs)) as SchemableK<EqKF>['product'],
    struct: fs => new StructSafeEqK(fs),
    sum: (t => fs => new SumSafeEqK(t, fs)) as SchemableK<EqKF>['sum'],

    defer: thunk => new DeferSafeEqK(thunk),
  }),
);

const SafeEqKTag = Symbol('@fp4ts/schema/kernel/safe-eq-k');
function isSafeEqK<F>(F: EqK<F>): F is SafeEqK<F> {
  return SafeEqKTag in F;
}

function liftSafeEq<F, A>(F: EqK<F>, E: Eq<A>): SafeEq<Kind<F, [A]>> {
  return isSafeEqK(F)
    ? F.liftSafeEq(E)
    : SafeEq.of({
        safeEquals: (x, y) =>
          Eval.delay(() => F.liftEq(E)).map(E => E.equals(x, y)),
      });
}

abstract class SafeEqK<F> implements EqK<F> {
  public readonly _F!: any;
  public readonly [SafeEqKTag] = true;

  private readonly cache = new Map<Eq<any>, SafeEq<Kind<F, [any]>>>();
  private readonly __void!: void;

  public liftEq = <A>(E: Eq<A>): Eq<Kind<F, [A]>> => {
    return this.liftSafeEq(E);
  };

  public lift = <A>(p: (l: A, r: A) => boolean): Eq<Kind<F, [A]>> => {
    return this.liftSafeEq(
      SafeEq.of({ safeEquals: (x, y) => Eval.delay(() => p(x, y)) }),
    );
  };

  public liftSafeEq<A>(E: Eq<A>): SafeEq<Kind<F, [A]>> {
    if (this.cache.has(E)) {
      return this.cache.get(E)!;
    }
    const EA = this.liftSafeEq0(E);
    this.cache.set(E, EA);
    return EA;
  }

  protected abstract liftSafeEq0<A>(E: Eq<A>): SafeEq<Kind<F, [A]>>;
}

class NullableSafeEqK<F> extends SafeEqK<[NullableK, F]> {
  public constructor(private readonly f: EqK<F>) {
    super();
  }

  protected liftSafeEq0<A>(E: Eq<A>): SafeEq<Kind<F, [A]> | null> {
    return SafeEq.of<Kind<F, [A]> | null>({
      safeEquals: (l, r) => {
        if (l === r) return Eval.now(true);
        if (l === null) return Eval.now(false);
        if (r === null) return Eval.now(false);
        return Eval.defer(() => safeEquals(liftSafeEq(this.f, E), l, r));
      },
    });
  }
}

class ProductSafeEqK<F extends unknown[]> extends SafeEqK<ProductK<F>> {
  public constructor(private readonly fs: { [k in keyof F]: EqK<F[k]> }) {
    super();
  }

  protected liftSafeEq0<A>(E: Eq<A>): SafeEq<Kind<StructK<F>, [A]>> {
    const fs = this.fs.map(f => liftSafeEq(f, E)) as {
      [k in keyof F]: SafeEq<Kind<F[k], [A]>>;
    };
    return productSafeEq<Kind<ProductK<F>, [A]>>(
      ...(fs as { [k in keyof F]: SafeEq<Kind<F[k], [A]>> }),
    );
  }
}

class StructSafeEqK<F extends {}> extends SafeEqK<StructK<F>> {
  public constructor(private readonly fs: { [k in keyof F]: EqK<F[k]> }) {
    super();
  }

  protected liftSafeEq0<A>(E: Eq<A>): SafeEq<Kind<StructK<F>, [A]>> {
    const fs: Partial<{ [k in keyof F]: SafeEq<Kind<F[k], [A]>> }> = {};
    for (const k in this.fs) {
      fs[k] = liftSafeEq(this.fs[k], E) as any;
    }
    return structSafeEq<Kind<StructK<F>, [A]>>(
      fs as { [k in keyof F]: SafeEq<Kind<F[k], [A]>> },
    );
  }
}

class SumSafeEqK<T extends string, F extends {}> extends SafeEqK<SumK<F>> {
  public constructor(
    private readonly tag: T,
    private readonly fs: { [k in keyof F]: EqK<F[k]> },
  ) {
    super();
  }

  protected liftSafeEq0<A>(E: Eq<A>): SafeEq<Kind<SumK<F>, [A]>> {
    const fs: Partial<{ [k in keyof F]: SafeEq<Kind<F[k], [A]>> }> = {};
    for (const k in this.fs) {
      fs[k] = liftSafeEq(this.fs[k], E) as any;
    }
    return sumSafeEq(this.tag)<Kind<StructK<F>, [A]>>(
      fs as { [k in keyof F]: SafeEq<Kind<F[k], [A]>> },
    );
  }
}

class ImapSafeEqK<F, G> extends SafeEqK<G> {
  public constructor(
    private readonly sf: EqK<F>,
    private readonly f: FunctionK<F, G>,
    private readonly g: FunctionK<G, F>,
  ) {
    super();
  }

  protected liftSafeEq0<A>(E: Eq<A>): SafeEq<Kind<G, [A]>> {
    return imapSafeEq(liftSafeEq(this.sf, E), this.f, this.g);
  }
}

class DeferSafeEqK<F> extends SafeEqK<F> {
  public constructor(private readonly thunk: () => EqK<F>) {
    super();
  }

  protected liftSafeEq0<A>(E: Eq<A>): SafeEq<Kind<F, [A]>> {
    return deferSafeEq(() => liftSafeEq(this.thunk(), E));
  }
}
