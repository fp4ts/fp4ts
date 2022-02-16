// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/ban-types */
import { Kind, Lazy, lazyVal } from '@fp4ts/core';
import { Array, Const, Eq, EqK, EqKF, Identity, Option } from '@fp4ts/cats';
import { SchemableK } from './schemable-k';
import { ProductK, StructK, SumK } from './kinds';

export const eqKSchemableK: Lazy<SchemableK<EqKF>> = lazyVal(() =>
  SchemableK.of({
    boolean: Const.EqK(Eq.fromUniversalEquals<boolean>()),
    number: Const.EqK(Eq.fromUniversalEquals<number>()),
    string: Const.EqK(Eq.fromUniversalEquals<string>()),
    null: Const.EqK(Eq.fromUniversalEquals<null>()),
    literal: () => Const.EqK(Eq.fromUniversalEquals<any>()),
    array: f => EqK.compose(Array.EqK(), f),

    compose_: EqK.compose,
    defer: thunk => {
      const t = lazyVal(thunk);
      return EqK.of({ liftEq: E => t().liftEq(E) });
    },
    imap_: (fa, f, g) => EqK.by(fa, g),

    optional: f => EqK.compose(Option.EqK, f),

    par: Identity.EqK,

    product: product as SchemableK<EqKF>['product'],
    struct,
    sum: sum as SchemableK<EqKF>['sum'],
  }),
);

const product = <F extends unknown[]>(
  ...fs: { [k in keyof F]: EqK<F[k]> }
): EqK<ProductK<F>> =>
  EqK.of({
    liftEq: <A>(E: Eq<A>): Eq<Kind<ProductK<F>, [A]>> =>
      Eq.of({
        equals: (xs, ys) =>
          xs.every((x, i) => fs[i].liftEq(E).equals(x, ys[i])),
      }),
  });

export const struct = <F extends {}>(fs: { [k in keyof F]: EqK<F[k]> }): EqK<
  StructK<F>
> =>
  EqK.of({
    liftEq: <A>(E: Eq<A>): Eq<Kind<StructK<F>, [A]>> => {
      const keys = Object.keys(fs) as (keyof typeof fs)[];
      return Eq.of({
        equals: (xs, ys) =>
          keys.every(k => fs[k].liftEq(E).equals(xs[k], ys[k])),
      });
    },
  });

export const sum =
  <T extends string>(tag: T) =>
  <F extends {}>(fs: {
    [k in keyof F]: EqK<F[k]>;
  }): EqK<SumK<F>> =>
    EqK.of<SumK<F>>({
      liftEq: <A>(E: Eq<A>): Eq<Kind<SumK<F>, [A]>> =>
        Eq.of({
          equals: (xs, ys) => {
            const lt = (xs as any)[tag] as keyof typeof fs;
            const rt = (ys as any)[tag] as keyof typeof fs;
            if (lt !== rt) return false;
            return fs[lt].liftEq(E).equals(xs, ys);
          },
        }),
    });
