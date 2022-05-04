// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/ban-types */
import { Kind, Lazy, lazyVal } from '@fp4ts/core';
import {
  Array,
  Const,
  Eval,
  FunctionK,
  Functor,
  FunctorF,
  Identity,
} from '@fp4ts/cats';
import { SchemableK } from './schemable-k';
import { ProductK, SumK, StructK, NullableK } from './kinds';

export const functorSchemableK: Lazy<SchemableK<FunctorF>> = lazyVal(() => {
  const self: SchemableK<FunctorF> = SchemableK.of({
    boolean: Const.Functor<boolean>(),
    string: Const.Functor<string>(),
    number: Const.Functor<number>(),
    literal: () => Const.Functor<any>(),
    null: Const.Functor<null>(),
    par: Identity.Functor,

    array: f => self.compose_(Array.FunctorFilter(), f),
    nullable: <F>(F: Functor<F>) =>
      SafeFunctor.of<[NullableK, F]>({
        safeMap_: (fa, f) =>
          fa === null ? Eval.now(null) : Eval.defer(() => safeMap(F, fa, f)),
      }),

    product: productSafeFunctor as SchemableK<FunctorF>['product'],
    sum: sumSafeFunctor as SchemableK<FunctorF>['sum'],
    struct: structSafeFunctor,
    defer: deferSafeFunctor,
    imap_: imapSafeFunctor,
    compose_: <F, G>(sf: Functor<F>, sg: Functor<G>): Functor<[F, G]> =>
      Functor.compose(sf, sg),
  });
  return self;
});

export function safeMap<F, A, B>(
  F: Functor<F>,
  fa: Kind<F, [A]>,
  f: (a: A) => Eval<B>,
): Eval<Kind<F, [B]>> {
  return isSafeFunctor(F)
    ? F.safeMap_(fa, f)
    : Eval.delay(() => F.map_(fa, x => f(x).value));
}

const SafeFunctorTag = Symbol('@fp4ts/schema/kernel/safe-functor');
function isSafeFunctor<F>(F: Functor<F>): F is SafeFunctor<F> {
  return SafeFunctorTag in F;
}
export interface SafeFunctor<F> extends Functor<F> {
  safeMap_<A, B>(fa: Kind<F, [A]>, f: (a: A) => Eval<B>): Eval<Kind<F, [B]>>;
  [SafeFunctorTag]: true;
}
export type SafeFunctorRequirements<F> = Pick<SafeFunctor<F>, 'safeMap_'> &
  Partial<Functor<F>>;
export const SafeFunctor = Object.freeze({
  of: <F>(F: SafeFunctorRequirements<F>): SafeFunctor<F> => {
    const self: SafeFunctor<F> = {
      ...Functor.of({
        map_: (fa, f) => self.safeMap_(fa, x => Eval.later(() => f(x))).value,
      }),
      ...F,
      [SafeFunctorTag]: true,
    };
    return self;
  },
});

export const productSafeFunctor = <F extends unknown[]>(
  ...fs: { [k in keyof F]: Functor<F[k]> }
): SafeFunctor<ProductK<F>> =>
  SafeFunctor.of({
    safeMap_: <A, B>(
      fas: Kind<ProductK<F>, [A]>,
      f: (a: A) => Eval<B>,
    ): Eval<Kind<ProductK<F>, [B]>> =>
      fas.reduce(
        (eac, fa, i) =>
          eac.flatMap(acc => safeMap(fs[i], fa, f).map(x => [...acc, x])),
        Eval.now([] as any[]),
      ) as Eval<Kind<ProductK<F>, [B]>>,
  });

export const structSafeFunctor = <F extends {}>(fs: {
  [k in keyof F]: Functor<F[k]>;
}): SafeFunctor<StructK<F>> =>
  SafeFunctor.of({
    safeMap_: <A, B>(
      fas: Kind<StructK<F>, [A]>,
      f: (a: A) => Eval<B>,
    ): Eval<Kind<StructK<F>, [B]>> => {
      const keys = Object.keys(fas) as (keyof F)[];
      return keys.reduce(
        (eac, k) =>
          eac.flatMap(acc =>
            safeMap(fs[k], fas[k], f).map(x => ({ ...acc, [k]: x })),
          ),
        Eval.now({}) as Eval<Partial<Kind<StructK<F>, [B]>>>,
      ) as Eval<Kind<StructK<F>, [B]>>;
    },
  });

export const sumSafeFunctor =
  <T extends string>(tag: T) =>
  <F extends {}>(fs: {
    [k in keyof F]: Functor<F[k]>;
  }): SafeFunctor<SumK<F>> =>
    SafeFunctor.of<SumK<F>>({
      safeMap_: <A, B>(
        fa: Kind<SumK<F>, [A]>,
        f: (a: A) => Eval<B>,
      ): Eval<Kind<SumK<F>, [B]>> => {
        const k = (fa as any)[tag] as keyof F;
        const F = fs[k];
        return safeMap(F, fa, f);
      },
    });

export const imapSafeFunctor = <F, G>(
  sa: Functor<F>,
  f: FunctionK<F, G>,
  g: FunctionK<G, F>,
): SafeFunctor<G> =>
  SafeFunctor.of<G>({
    safeMap_: <A, B>(
      ga: Kind<G, [A]>,
      f2: (a: A) => Eval<B>,
    ): Eval<Kind<G, [B]>> => safeMap(sa, g(ga), f2).map(f),
  });

export const deferSafeFunctor = <G>(
  thunk: () => Functor<G>,
): SafeFunctor<G> => {
  const t = lazyVal(thunk);
  return SafeFunctor.of<G>({ safeMap_: (x, f) => safeMap(t(), x, f) });
};
