// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/ban-types */
import { instance, Kind, Lazy, lazyVal, pipe } from '@fp4ts/core';
import {
  Array,
  Option,
  Const,
  Eval,
  Foldable,
  Identity,
  Monoid,
  FunctionK,
  FoldableF,
} from '@fp4ts/cats';
import { SchemableK } from './schemable-k';
import { ProductK, StructK, SumK } from './kinds';

export const foldableSchemableK: Lazy<SchemableK<FoldableF>> = lazyVal(() => {
  const self: SchemableK<FoldableF> = instance({
    boolean: Const.Foldable<boolean>(Monoid.disjunction),
    string: Const.Foldable<string>(Monoid.string),
    number: Const.Foldable<number>(Monoid.addition),
    literal: (...xs) => Const.Foldable<any>(Monoid.first(xs[0])),
    null: Const.Foldable<null>(Monoid.first(null)),
    par: Identity.Foldable,

    array: f => self.compose_(Array.Foldable(), f),

    optional: f => self.compose_(Option.Foldable, f),

    product: product as SchemableK<FoldableF>['product'],
    sum: sum as SchemableK<FoldableF>['sum'],
    struct,
    defer,

    imap_: <F, G>(sa: Foldable<F>, f: FunctionK<F, G>, g: FunctionK<G, F>) =>
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
      }),

    compose_: <F, G>(sf: Foldable<F>, sg: Foldable<G>): Foldable<[F, G]> =>
      Foldable.compose(sf, sg),
  });

  return self;
});

const SafeFoldableTag = Symbol('@fp4ts/schema/kernel/safe-foldable');
function isSafeFoldable<F>(F: Foldable<F>): F is SafeFoldable<F> {
  return SafeFoldableTag in F;
}

function safeFoldLeft<F, A, B>(
  F: Foldable<F>,
  fa: Kind<F, [A]>,
  z: B,
  f: (b: B, a: A) => Eval<B>,
): Eval<B> {
  return isSafeFoldable(F)
    ? F.safeFoldLeft_(fa, z, f)
    : Eval.delay(() => F.foldLeft_(fa, z, (b, a) => f(b, a).value));
}

interface SafeFoldable<F> extends Foldable<F> {
  safeFoldLeft_<A, B>(
    fa: Kind<F, [A]>,
    z: B,
    f: (b: B, a: A) => Eval<B>,
  ): Eval<B>;
  [SafeFoldableTag]: true;
}
type SafeFoldableRequirements<F> = Pick<
  SafeFoldable<F>,
  'foldRight_' | 'safeFoldLeft_'
>;
const SafeFoldable = Object.freeze({
  of: <F>(F: SafeFoldableRequirements<F>): SafeFoldable<F> => {
    const self: SafeFoldable<F> = instance({
      ...Foldable.of({
        foldLeft_: <A, B>(fa: Kind<F, [A]>, z: B, f: (b: B, a: A) => B): B =>
          self.safeFoldLeft_(fa, z, (b, a) => Eval.delay(() => f(b, a))).value,
        ...F,
      }),
      ...F,
      [SafeFoldableTag]: true,
    });
    return self;
  },
});

const product = <F extends unknown[]>(
  ...fs: { [k in keyof F]: Foldable<F[k]> }
): Foldable<ProductK<F>> =>
  SafeFoldable.of({
    foldRight_<A, B>(
      fas: Kind<ProductK<F>, [B]>,
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
          : Eval.defer(() => safeFoldLeft(fas[idx], fas[idx], ac, f)).flatMap(
              ac => loop(ac, idx + 1),
            );

      return loop(z, 0);
    },
  });

const struct = <F extends {}>(fs: {
  [k in keyof F]: Foldable<F[k]>;
}): Foldable<StructK<F>> =>
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

const sum =
  <T extends string>(tag: T) =>
  <F extends {}>(fs: {
    [k in keyof F]: Foldable<F[k]>;
  }): Foldable<SumK<F>> =>
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

const defer = <F>(thunk: () => Foldable<F>): Foldable<F> =>
  SafeFoldable.of({
    foldRight_: (fa, eb, f) => thunk().foldRight_(fa, eb, f),
    safeFoldLeft_: (fa, b, f) => safeFoldLeft(thunk(), fa, b, f),
  });
