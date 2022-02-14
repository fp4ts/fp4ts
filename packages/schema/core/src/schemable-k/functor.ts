// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/ban-types */
import {
  $type,
  instance,
  Kind,
  Lazy,
  lazyVal,
  pipe,
  TyK,
  TyVar,
} from '@fp4ts/core';
import {
  Array,
  Const,
  FunctionK,
  Functor,
  Identity,
  Option,
} from '@fp4ts/cats';
import { SchemableK } from './schemable-k';
import { ProductK, SumK, StructK } from '../kinds';

const product = <F extends unknown[]>(
  ...fs: { [k in keyof F]: Functor<F[k]> }
): Functor<ProductK<F>> =>
  Functor.of({
    map_: <A, B>(
      fa: Kind<ProductK<F>, [A]>,
      f: (a: A) => B,
    ): Kind<ProductK<F>, [B]> =>
      fs.map((F, i) => F.map_(fa[i], f)) as Kind<ProductK<F>, [B]>,
  });

const struct = <F extends {}>(fs: {
  [k in keyof F]: Functor<F[k]>;
}): Functor<StructK<F>> =>
  Functor.of({
    map_: <A, B>(
      fa: Kind<StructK<F>, [A]>,
      f: (a: A) => B,
    ): Kind<StructK<F>, [B]> => {
      const res: Partial<Kind<StructK<F>, [B]>> = {};
      for (const k in fs) {
        res[k] = fs[k].map_(fa[k], f);
      }
      return res as Kind<StructK<F>, [B]>;
    },
  });

const sum =
  <T extends string>(tag: T) =>
  <F extends {}>(fs: {
    [k in keyof F]: Functor<F[k]>;
  }): Functor<SumK<F>> =>
    Functor.of<SumK<F>>({
      map_: <A, B>(
        fa: Kind<SumK<F>, [A]>,
        f: (a: A) => B,
      ): Kind<SumK<F>, [B]> => {
        const k = (fa as any)[tag] as keyof typeof fs;
        const F = fs[k];
        return F.map_(fa, f);
      },
    });

const defer = <G>(thunk: () => Functor<G>) =>
  Functor.of<G>({ map_: (x, f) => thunk().map_(x, f) });

export const functorSchemableK: Lazy<SchemableK<FunctorK>> = lazyVal(() => {
  const self: SchemableK<FunctorK> = instance({
    boolean: Const.Functor<boolean>(),
    string: Const.Functor<string>(),
    number: Const.Functor<number>(),
    literal: () => Const.Functor<any>(),
    null: Const.Functor<null>(),
    par: Identity.Functor,

    array: f => self.compose_(Array.Functor(), f),

    optional: f => self.compose_(Option.Functor, f),

    product: product as SchemableK<FunctorK>['product'],
    sum: sum as SchemableK<FunctorK>['sum'],
    struct,
    defer,

    imap_: <F, G>(sa: Functor<F>, f: FunctionK<F, G>, g: FunctionK<G, F>) =>
      Functor.of<G>({
        map_: <A, B>(fa: Kind<G, [A]>, f2: (a: A) => B) =>
          pipe(g(fa), sa.map(f2), f),
      }),

    compose_: <F, G>(sf: Functor<F>, sg: Functor<G>): Functor<[F, G]> =>
      Functor.compose(sf, sg),
  });
  return self;
});

// -- HKT

export interface FunctorK extends TyK<[unknown]> {
  [$type]: Functor<TyVar<this, 0>>;
}
