// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Applicative, Contravariant, Functor } from '@fp4ts/cats';
import { $, $type, cached, Eval, F1, Kind, TyK, TyVar } from '@fp4ts/core';
import { Indexable } from './indexable';

/**
 * Implementation of a StateT with lazy state value specialized to number.
 */
export type Indexing<F, A> = (
  i: Eval<number>,
) => Eval<[Kind<F, [A]>, Eval<number>]>;

export const Indexing = function <F, A>(
  runIndexing: (i: Eval<number>) => Eval<[Kind<F, [A]>, Eval<number>]>,
): Indexing<F, A> {
  return runIndexing;
};

// -- Operators

export function indexing<F, P, RepF, CorepF, A, B, S, T>(
  P: Indexable<P, number, RepF, CorepF>,
  l: (f: (a: A) => Indexing<F, B>) => (s: S) => Indexing<F, T>,
): (pafb: Kind<P, [A, Kind<F, [B]>]>) => (s: S) => Kind<F, [T]> {
  return (pafb: Kind<P, [A, Kind<F, [B]>]>) => {
    const ipafb = P.indexed(pafb);
    const sift = l((a: A) => i => i.map(i => [ipafb(a, i), Eval.now(i + 1)]));
    return (s: S) => sift(s)(Eval.zero).value[0];
  };
}

// -- Instances

const indexingFunctor = cached(
  <F>(F: Functor<F>): Functor<$<IndexingF, [F]>> =>
    Functor.of({
      map_: (fa, f) =>
        F1.andThen(fa, efai => efai.map(([fa, i]) => [F.map_(fa, f), i])),
    }),
);

const indexingContravariant = cached(
  <F>(F: Contravariant<F>): Contravariant<$<IndexingF, [F]>> =>
    Contravariant.of({
      contramap_: (fa, f) =>
        F1.andThen(fa, efai => efai.map(([fa, i]) => [F.contramap_(fa, f), i])),
    }),
);

const indexingApplicative = cached(
  <F>(F: Applicative<F>): Applicative<$<IndexingF, [F]>> =>
    Applicative.of({
      ...indexingFunctor(F),
      pure:
        <A>(a: A) =>
        i =>
          Eval.now([F.pure(a), i]),

      ap_:
        <A, B>(iff: Indexing<F, (a: A) => B>, ifa: Indexing<F, A>) =>
        i =>
          Eval.defer(() =>
            iff(i).flatMap(([ff, j]) =>
              ifa(j).map(([fa, k]) => [F.ap_(ff, fa), k]),
            ),
          ),

      map2_:
        <A, B, C>(
          ifa: Indexing<F, A>,
          ifb: Indexing<F, B>,
          f: (a: A, b: B) => C,
        ) =>
        i =>
          Eval.defer(() =>
            ifa(i).flatMap(([fa, j]) =>
              ifb(j).map(([fb, k]) => [F.map2_(fa, fb, f), k]),
            ),
          ),

      map2Eval_: <A, B, C>(
        ifa: Indexing<F, A>,
        eifb: Eval<Indexing<F, B>>,
        f: (a: A, b: B) => C,
      ): Eval<Indexing<F, C>> =>
        Eval.now(
          F1.andThen(ifa, efaj =>
            efaj.flatMap(([fa, j]) => {
              const [efb, k] = eifb.flatMap(ifb => ifb(j)).unzip();
              return F.map2Eval_(fa, efb, f).map(fc => [fc, k.flatten()]);
            }),
          ),
        ),
    }),
);

Indexing.Functor = indexingFunctor;
Indexing.Contravariant = indexingContravariant;
Indexing.Applicative = indexingApplicative;

// -- HKT

export interface IndexingF extends TyK<[unknown, unknown]> {
  [$type]: Indexing<TyVar<this, 0>, TyVar<this, 1>>;
}
