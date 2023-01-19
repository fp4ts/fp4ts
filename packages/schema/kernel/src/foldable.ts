// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/ban-types */
import { Eval, Kind, Lazy, lazyVal, pipe } from '@fp4ts/core';
import {
  Array,
  Const,
  Foldable,
  Identity,
  FunctionK,
  FoldableF,
  Monoid,
} from '@fp4ts/cats';
import { SchemableK } from './schemable-k';
import { NullableK, ProductK, StructK, SumK } from './kinds';

export const foldableSchemableK: Lazy<SchemableK<FoldableF>> = lazyVal(() => {
  const self: SchemableK<FoldableF> = SchemableK.of({
    boolean: Const.Foldable<boolean>(),
    string: Const.Foldable<string>(),
    number: Const.Foldable<number>(),
    literal: () => Const.Foldable<any>(),
    null: Const.Foldable<null>(),
    par: Identity.Foldable,

    array: f => self.compose_(Array.FoldableWithIndex(), f),
    nullable: <F>(F: Foldable<F>) =>
      SafeFoldable.of<[NullableK, F]>({
        safeFoldLeft_: (fa, z, f) =>
          fa === null ? Eval.now(z) : safeFoldLeft(F, fa, z, f),

        foldRight_: (fa, z, f) => (fa === null ? z : F.foldRight_(fa, z, f)),
      }),

    product: productSafeFoldable as SchemableK<FoldableF>['product'],
    sum: sumSafeFoldable as SchemableK<FoldableF>['sum'],
    struct: structSafeFoldable,
    defer: deferSafeFoldable,
    imap_: imapSafeFoldable,

    compose_: <F, G>(sf: Foldable<F>, sg: Foldable<G>): Foldable<[F, G]> =>
      Foldable.compose(sf, sg),
  });

  return self;
});

const SafeFoldableTag = Symbol('@fp4ts/schema/kernel/safe-foldable');
function isSafeFoldable<F>(F: Foldable<F>): F is SafeFoldable<F> {
  return SafeFoldableTag in F;
}

export function safeFoldLeft<F, A, B>(
  F: Foldable<F>,
  fa: Kind<F, [A]>,
  z: B,
  f: (b: B, a: A) => Eval<B>,
): Eval<B> {
  return isSafeFoldable(F)
    ? F.safeFoldLeft_(fa, z, f)
    : Eval.delay(() => F.foldLeft_(fa, z, (b, a) => f(b, a).value));
}

export interface SafeFoldable<F> extends Foldable<F> {
  safeFoldLeft_<A, B>(
    fa: Kind<F, [A]>,
    z: B,
    f: (b: B, a: A) => Eval<B>,
  ): Eval<B>;
  [SafeFoldableTag]: true;
}
export type SafeFoldableRequirements<F> = Pick<
  SafeFoldable<F>,
  'foldRight_' | 'safeFoldLeft_'
>;
export const SafeFoldable = Object.freeze({
  of: <F>(F: SafeFoldableRequirements<F>): SafeFoldable<F> => {
    const self: SafeFoldable<F> = {
      ...Foldable.of({
        foldLeft_: <A, B>(fa: Kind<F, [A]>, z: B, f: (b: B, a: A) => B): B =>
          self.safeFoldLeft_(fa, z, (b, a) => Eval.delay(() => f(b, a))).value,

        foldMap_:
          <M>(M: Monoid<M>) =>
          <A>(fa: Kind<F, [A]>, f: (a: A) => M): M =>
            self.foldRight_(fa, Eval.now(M.empty), (a, eb) =>
              M.combineEval_(f(a), eb),
            ).value,
        ...F,
      }),
      ...F,
      [SafeFoldableTag]: true,
    };
    return self;
  },
});

export const productSafeFoldable = <F extends unknown[]>(
  ...fs: { [k in keyof F]: Foldable<F[k]> }
): SafeFoldable<ProductK<F>> =>
  SafeFoldable.of({
    foldRight_<A, B>(
      fas: Kind<ProductK<F>, [A]>,
      ez: Eval<B>,
      f: (a: A, eb: Eval<B>) => Eval<B>,
    ): Eval<B> {
      const loop = (idx: number): Eval<B> =>
        idx >= fs.length
          ? ez
          : Eval.defer(() => fs[idx].foldRight_(fas[idx], loop(idx + 1), f));
      return loop(0);
    },

    safeFoldLeft_<A, B>(
      fas: Kind<ProductK<F>, [A]>,
      z: B,
      f: (b: B, a: A) => Eval<B>,
    ): Eval<B> {
      const loop = (ac: B, idx: number): Eval<B> =>
        idx >= fas.length
          ? Eval.now(ac)
          : Eval.defer(() => safeFoldLeft(fs[idx], fas[idx], ac, f)).flatMap(
              ac => loop(ac, idx + 1),
            );

      return loop(z, 0);
    },
  });

export const structSafeFoldable = <F extends {}>(fs: {
  [k in keyof F]: Foldable<F[k]>;
}): SafeFoldable<StructK<F>> =>
  SafeFoldable.of({
    foldRight_<A, B>(
      fas: Kind<StructK<F>, [A]>,
      ez: Eval<B>,
      f: (a: A, eb: Eval<B>) => Eval<B>,
    ): Eval<B> {
      const keys = Object.keys(fs) as (keyof typeof fs)[];
      const loop = (idx: number): Eval<B> =>
        idx >= keys.length
          ? ez
          : Eval.defer(() =>
              fs[keys[idx]].foldRight_(fas[keys[idx]], loop(idx + 1), f),
            );

      return loop(0);
    },
    safeFoldLeft_<A, B>(
      fas: Kind<StructK<F>, [A]>,
      z: B,
      f: (b: B, a: A) => Eval<B>,
    ): Eval<B> {
      const keys = Object.keys(fs) as (keyof typeof fs)[];
      const loop = (ac: B, idx: number): Eval<B> =>
        idx >= keys.length
          ? Eval.now(ac)
          : Eval.defer(() =>
              safeFoldLeft(fs[keys[idx]], fas[keys[idx]], ac, f),
            ).flatMap(ac => loop(ac, idx + 1));

      return loop(z, 0);
    },
  });

export const sumSafeFoldable =
  <T extends string>(tag: T) =>
  <F extends {}>(fs: {
    [k in keyof F]: Foldable<F[k]>;
  }): SafeFoldable<SumK<F>> =>
    SafeFoldable.of<SumK<F>>({
      foldRight_<A, B>(
        fa: Kind<SumK<F>, [A]>,
        ez: Eval<B>,
        f: (a: A, eb: Eval<B>) => Eval<B>,
      ): Eval<B> {
        const k = (fa as any)[tag] as keyof typeof fs;
        const F = fs[k];
        return F.foldRight_(fa, ez, f);
      },
      safeFoldLeft_<A, B>(
        fa: Kind<SumK<F>, [A]>,
        z: B,
        f: (b: B, a: A) => Eval<B>,
      ): Eval<B> {
        const k = (fa as any)[tag] as keyof typeof fs;
        const F = fs[k];
        return safeFoldLeft(F, fa, z, f);
      },
    });

export const imapSafeFoldable = <F, G>(
  sa: Foldable<F>,
  f: FunctionK<F, G>,
  g: FunctionK<G, F>,
) =>
  SafeFoldable.of<G>({
    foldRight_<A, B>(
      ga: Kind<G, [A]>,
      ez: Eval<B>,
      f2: (a: A, eb: Eval<B>) => Eval<B>,
    ) {
      return pipe(g(ga), sa.foldRight(ez, f2));
    },

    safeFoldLeft_<A, B>(
      ga: Kind<G, [A]>,
      z: B,
      f2: (b: B, a: A) => Eval<B>,
    ): Eval<B> {
      return safeFoldLeft(sa, g(ga), z, f2);
    },
  });

export const deferSafeFoldable = <F>(
  thunk: () => Foldable<F>,
): SafeFoldable<F> => {
  const t = lazyVal(thunk);
  return SafeFoldable.of({
    foldRight_: (fa, eb, f) => t().foldRight_(fa, eb, f),
    safeFoldLeft_: (fa, b, f) => safeFoldLeft(t(), fa, b, f),
  });
};
