// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/ban-types */
import { Kind, Lazy, lazyVal } from '@fp4ts/core';
import {
  Applicative,
  Array,
  Const,
  Eval,
  FunctionK,
  Identity,
  Traversable,
  TraversableF,
} from '@fp4ts/cats';
import {
  deferSafeFoldable,
  imapSafeFoldable,
  productSafeFoldable,
  SafeFoldable,
  safeFoldLeft,
  // safeFoldLeft,
  structSafeFoldable,
  sumSafeFoldable,
} from './foldable';
import {
  deferSafeFunctor,
  imapSafeFunctor,
  productSafeFunctor,
  SafeFunctor,
  safeMap,
  structSafeFunctor,
  sumSafeFunctor,
} from './functor';
import { SchemableK } from './schemable-k';
import { NullableK, ProductK, StructK, SumK } from './kinds';

export const traversableSchemableK: Lazy<SchemableK<TraversableF>> = lazyVal(
  () => {
    const self: SchemableK<TraversableF> = SchemableK.of({
      boolean: Const.Traversable<boolean>(),
      string: Const.Traversable<string>(),
      number: Const.Traversable<number>(),
      literal: () => Const.Traversable<any>(),
      null: Const.Traversable<null>(),
      par: Identity.Traversable,

      array: f => self.compose_(Array.Traversable(), f),
      nullable: <F>(F: Traversable<F>) =>
        SafeTraversable.of<[NullableK, F]>({
          ...SafeFunctor.of<[NullableK, F]>({
            safeMap_: (fa, f) =>
              fa === null
                ? Eval.now(null)
                : Eval.defer(() => safeMap(F, fa, f)),
          }),

          ...SafeFoldable.of<[NullableK, F]>({
            safeFoldLeft_: (fa, z, f) =>
              fa === null ? Eval.now(z) : safeFoldLeft(F, fa, z, f),

            foldRight_: (fa, z, f) =>
              fa === null ? z : F.foldRight_(fa, z, f),
          }),

          safeTraverse_:
            <G>(G: Applicative<G>) =>
            <A, B>(fa: Kind<F, [A]> | null, f: (a: A) => Eval<Kind<G, [B]>>) =>
              fa === null ? Eval.now(G.pure(null)) : safeTraverse(G)(F, fa, f),
        }),

      product: productSafeTraversable as SchemableK<TraversableF>['product'],
      sum: sumSafeTraversable as SchemableK<TraversableF>['sum'],
      struct: structSafeTraversable,

      defer: deferSafeTraversable,

      imap_: imapSafeTraversable,

      compose_: <F, G>(
        sf: Traversable<F>,
        sg: Traversable<G>,
      ): Traversable<[F, G]> => Traversable.compose(sf, sg),
    });
    return self;
  },
);

const SafeTraversableTag = Symbol('@fp4ts/schema/kernel/safe-traversable');
function isSafeTraversable<F>(F: Traversable<F>): F is SafeTraversable<F> {
  return SafeTraversableTag in F;
}

function safeTraverse<G>(G: Applicative<G>) {
  return function <F, A, B>(
    F: Traversable<F>,
    fa: Kind<F, [A]>,
    f: (a: A) => Eval<Kind<G, [B]>>,
  ): Eval<Kind<G, [Kind<F, [B]>]>> {
    return isSafeTraversable(F)
      ? F.safeTraverse_(G)(fa, f)
      : Eval.delay(() => F.traverse_(G)(fa, x => f(x).value));
  };
}

export interface SafeTraversable<F>
  extends Traversable<F>,
    SafeFoldable<F>,
    SafeFunctor<F> {
  safeTraverse_: <G>(
    G: Applicative<G>,
  ) => <A, B>(
    fa: Kind<F, [A]>,
    f: (a: A) => Eval<Kind<G, [B]>>,
  ) => Eval<Kind<G, [Kind<F, [B]>]>>;

  [SafeTraversableTag]: true;
}
export type SafeTraversableRequirements<F> = Pick<
  SafeTraversable<F>,
  'safeTraverse_'
> &
  SafeFoldable<F> &
  SafeFunctor<F>;
const SafeTraversable = Object.freeze({
  of: <F>(F: SafeTraversableRequirements<F>): SafeTraversable<F> => {
    const self: SafeTraversable<F> = {
      ...Traversable.of({
        foldLeft_: (fa, z, f) => self.foldLeft_(fa, z, f),
        foldRight_: (fa, ez, f) => self.foldRight_(fa, ez, f),
        traverse_:
          <G>(G: Applicative<G>) =>
          <A, B>(fa: Kind<F, [A]>, f: (a: A) => Kind<G, [B]>) =>
            self.safeTraverse_(G)(fa, x => Eval.later(() => f(x))).value,
      }),
      ...F,

      [SafeTraversableTag]: true,
    };
    return self;
  },
});

export const productSafeTraversable = <F extends unknown[]>(
  ...fs: { [k in keyof F]: Traversable<F[k]> }
): SafeTraversable<ProductK<F>> =>
  SafeTraversable.of({
    ...productSafeFunctor<F>(...fs),
    ...productSafeFoldable<F>(...fs),

    safeTraverse_:
      <G>(G: Applicative<G>) =>
      <A, B>(
        fas: Kind<ProductK<F>, [A]>,
        f: (a: A) => Eval<Kind<G, [B]>>,
      ): Eval<Kind<G, [Kind<ProductK<F>, [B]>]>> =>
        fas.reduce(
          (egac, fa, i) =>
            egac.flatMap(gac =>
              G.map2Eval_(
                gac,
                safeTraverse(G)(fs[i], fa, f),
              )((ac, x) => [...ac, x]),
            ),
          Eval.now(G.pure([] as any[])),
        ) as Eval<Kind<G, [Kind<ProductK<F>, [B]>]>>,
  });

export const structSafeTraversable = <F extends {}>(fs: {
  [k in keyof F]: Traversable<F[k]>;
}): SafeTraversable<StructK<F>> =>
  SafeTraversable.of({
    ...structSafeFunctor<F>(fs),
    ...structSafeFoldable<F>(fs),

    safeTraverse_:
      <G>(G: Applicative<G>) =>
      <A, B>(
        fas: Kind<StructK<F>, [A]>,
        f: (a: A) => Eval<Kind<G, [B]>>,
      ): Eval<Kind<G, [Kind<StructK<F>, [B]>]>> => {
        const keys = Object.keys(fas) as (keyof F)[];
        return keys.reduce(
          (egac, k) =>
            egac.flatMap(gac =>
              G.map2Eval_(
                gac,
                safeTraverse(G)(fs[k], fas[k], f),
              )((ac, x) => ({ ...ac, [k]: x })),
            ),
          Eval.now(G.pure({} as Partial<Kind<StructK<F>, [B]>>)),
        ) as Eval<Kind<G, [Kind<StructK<F>, [B]>]>>;
      },
  });

export const sumSafeTraversable =
  <T extends string>(tag: T) =>
  <F extends {}>(fs: { [k in keyof F]: Traversable<F[k]> }): SafeTraversable<
    SumK<F>
  > =>
    SafeTraversable.of({
      ...sumSafeFunctor(tag)<F>(fs),
      ...sumSafeFoldable(tag)<F>(fs),

      safeTraverse_:
        <G>(G: Applicative<G>) =>
        <A, B>(
          fa: Kind<SumK<F>, [A]>,
          f: (a: A) => Eval<Kind<G, [B]>>,
        ): Eval<Kind<G, [Kind<SumK<F>, [B]>]>> => {
          const k = (fa as any)[tag] as keyof F;
          const F = fs[k];
          return safeTraverse(G)(F, fa, f);
        },
    });

export const imapSafeTraversable = <F, G>(
  F: Traversable<F>,
  f: FunctionK<F, G>,
  g: FunctionK<G, F>,
) =>
  SafeTraversable.of<G>({
    ...imapSafeFunctor(F, f, g),
    ...imapSafeFoldable(F, f, g),

    safeTraverse_:
      <H>(H: Applicative<H>) =>
      <A, B>(
        ga: Kind<G, [A]>,
        f2: (a: A) => Eval<Kind<H, [B]>>,
      ): Eval<Kind<H, [Kind<G, [B]>]>> =>
        safeTraverse(H)(F, g(ga), f2).map(H.map(f)),
  });

export const deferSafeTraversable = <F>(
  thunk: () => Traversable<F>,
): SafeTraversable<F> => {
  const t = lazyVal(thunk);
  return SafeTraversable.of({
    ...deferSafeFunctor(t),
    ...deferSafeFoldable(t),
    safeTraverse_:
      <G>(G: Applicative<G>) =>
      <A, B>(
        fa: Kind<F, [A]>,
        f: (a: A) => Eval<Kind<G, [B]>>,
      ): Eval<Kind<G, [Kind<F, [B]>]>> =>
        safeTraverse(G)(t(), fa, f),
  });
};
