// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, Eval, fst, Kind, snd, TyK, TyVar } from '@fp4ts/core';
import { Eq, Monoid } from '@fp4ts/cats-kernel';
import { Align } from '../align';
import { Applicative } from '../applicative';
import { Apply } from '../apply';
import { Contravariant } from '../contravariant';
import { Defer } from '../defer';
import { Distributive } from '../distributive';
import { EqK } from '../eq-k';
import { FlatMap } from '../flat-map';
import { Foldable } from '../foldable';
import { Functor } from '../functor';
import { FunctorFilter } from '../functor-filter';
import { Monad } from '../monad';
import { MonoidK } from '../monoid-k';
import { SemigroupK } from '../semigroup-k';
import { Traversable } from '../traversable';
import { TraversableFilter } from '../traversable-filter';
import { Zip } from '../zip';
import { Option } from './option';
import { Alternative } from '../alternative';
import { Iter } from './collections';

/**
 * Product of the two functors.
 */
export type Product<F, G, A> = [Kind<F, [A]>, Kind<G, [A]>];
export const Product = function <F, G, A>(
  fa: Kind<F, [A]>,
  ga: Kind<G, [A]>,
): Product<F, G, A> {
  return [fa, ga];
};

Product.EqK = <F, G>(F: EqK<F>, G: EqK<G>) =>
  EqK.of<$<ProductF, [F, G]>>({
    liftEq: <A>(E: Eq<A>) => Eq.tuple(F.liftEq(E), G.liftEq(E)),
  });

Product.Defer = <F, G>(F: Defer<F>, G: Defer<G>) =>
  Defer.of<$<ProductF, [F, G]>>({
    defer: thunk => [F.defer(() => thunk()[0]), G.defer(() => thunk()[1])],
  });

Product.SemigroupK = <F, G>(F: SemigroupK<F>, G: SemigroupK<G>) =>
  SemigroupK.of<$<ProductF, [F, G]>>({
    combineK_: ([lfa, lga], [rfa, rga]) => [
      F.combineK_(lfa, rfa),
      G.combineK_(lga, rga),
    ],
    combineKEval_: ([lfa, lga], erfarga) => {
      erfarga = erfarga.memoize;
      return F.combineKEval_(lfa, erfarga.map(fst)).flatMap(fa =>
        G.combineKEval_(lga, erfarga.map(snd)).map(ga => [fa, ga]),
      );
    },
  });

Product.MonoidK = <F, G>(F: MonoidK<F>, G: MonoidK<G>) => {
  const S = Product.SemigroupK(F, G);
  return MonoidK.of<$<ProductF, [F, G]>>({
    combineK_: S.combineK_,
    combineKEval_: S.combineKEval_,
    emptyK: () => [F.emptyK(), G.emptyK()],
  });
};

Product.Functor = <F, G>(
  F: Functor<F>,
  G: Functor<G>,
): Functor<$<ProductF, [F, G]>> =>
  Functor.of({ map_: ([fa, ga], f) => [F.map_(fa, f), G.map_(ga, f)] });

Product.Contravariant = <F, G>(F: Contravariant<F>, G: Contravariant<G>) =>
  Contravariant.of<$<ProductF, [F, G]>>({
    contramap_: ([fa, ga], f) => [F.contramap_(fa, f), G.contramap_(ga, f)],
  });

Product.FunctorFilter = <F, G>(
  F: FunctorFilter<F>,
  G: FunctorFilter<G>,
): FunctorFilter<$<ProductF, [F, G]>> =>
  FunctorFilter.of({
    ...Product.Functor(F, G),
    mapFilter_: ([fa, ga], f) => [F.mapFilter_(fa, f), G.mapFilter_(ga, f)],
    filter_: <A>([fa, ga]: Product<F, G, A>, f: (a: A) => boolean) =>
      [F.filter_(fa, f), G.filter_(ga, f)] as Product<F, G, A>,
    filterNot_: ([fa, ga], f) => [F.filterNot_(fa, f), G.filterNot_(ga, f)],
  });

Product.Distributive = <F, G>(F: Distributive<F>, G: Distributive<G>) =>
  Distributive.of<$<ProductF, [F, G]>>({
    ...Product.Functor(F, G),
    distribute_:
      <H>(H: Functor<H>) =>
      <A, B>(ha: Kind<H, [A]>, f: (a: A) => Product<F, G, B>) =>
        [
          F.distribute_(H)(ha, x => f(x)[0]),
          G.distribute_(H)(ha, x => f(x)[1]),
        ],
  });

Product.Apply = <F, G>(F: Apply<F>, G: Apply<G>): Apply<$<ProductF, [F, G]>> =>
  Apply.of({
    ...Product.Functor(F, G),
    ap_: ([ffa, gfa], [fa, ga]) => [F.ap_(ffa, fa), G.ap_(gfa, ga)],
    map2_: <A, B, C>(
      [fa, ga]: Product<F, G, A>,
      [fb, gb]: Product<F, G, B>,
      f: (a: A, b: B) => C,
    ) => [F.map2_(fa, fb, f), G.map2_(ga, gb, f)],
    map2Eval_: <A, B, C>(
      [fa, ga]: Product<F, G, A>,
      efbgb: Eval<Product<F, G, B>>,
      f: (a: A, b: B) => C,
    ) => {
      efbgb = efbgb.memoize;
      return F.map2Eval_(fa, efbgb.map(fst), f).flatMap(fc =>
        G.map2Eval_(ga, efbgb.map(snd), f).map(gc => [fc, gc]),
      );
    },
  });

Product.FlatMap = <F, G>(F: FlatMap<F>, G: FlatMap<G>) =>
  FlatMap.of<$<ProductF, [F, G]>>({
    ...Product.Apply(F, G),
    flatMap_: ([fa, ga], f) => [
      F.flatMap_(fa, a => f(a)[0]),
      G.flatMap_(ga, a => f(a)[1]),
    ],
    tailRecM_: (s0, f) => [
      F.tailRecM_(s0, s => f(s)[0]),
      G.tailRecM_(s0, s => f(s)[1]),
    ],
  });

Product.Applicative = <F, G>(F: Applicative<F>, G: Applicative<G>) =>
  Applicative.of<$<ProductF, [F, G]>>({
    ...Product.Apply(F, G),
    pure: a => [F.pure(a), G.pure(a)],
  });

Product.Alternative = <F, G>(F: Alternative<F>, G: Alternative<G>) =>
  Alternative.of<$<ProductF, [F, G]>>({
    ...Product.Applicative(F, G),
    ...Product.MonoidK(F, G),
  });

Product.Monad = <F, G>(F: Monad<F>, G: Monad<G>) =>
  Monad.of<$<ProductF, [F, G]>>({
    ...Product.Applicative(F, G),
    ...Product.FlatMap(F, G),
  });

Product.Foldable = <F, G>(F: Foldable<F>, G: Foldable<G>) =>
  Foldable.of<$<ProductF, [F, G]>>({
    foldMap_:
      <M>(M: Monoid<M>) =>
      <A>([fa, ga]: Product<F, G, A>, f: (a: A) => M) =>
        M.combineEval_(
          F.foldMap_(M)(fa, f),
          Eval.later(() => G.foldMap_(M)(ga, f)),
        ).value,

    foldLeft_: ([fa, ga], z, f) => G.foldLeft_(ga, F.foldLeft_(fa, z, f), f),

    foldRight_: ([fa, ga], ez, f) =>
      F.foldRight_(
        fa,
        Eval.defer(() => G.foldRight_(ga, ez, f)),
        f,
      ),

    size: ([fa, ga]) => F.size(fa) + G.size(ga),
    isEmpty: ([fa, ga]) => F.isEmpty(fa) && G.isEmpty(ga),
    nonEmpty: ([fa, ga]) => F.nonEmpty(fa) || G.nonEmpty(ga),
    all_: ([fa, ga], f) => F.all_(fa, f) && G.all_(ga, f),
    any_: ([fa, ga], f) => F.any_(fa, f) || G.any_(ga, f),
    count_: ([fa, ga], f) => F.count_(fa, f) + G.count_(ga, f),
    iterator: ([fa, ga]) => Iter.concat_(F.iterator(fa), G.iterator(ga)),
    toArray: ([fa, ga]) => F.toArray(fa).concat(G.toArray(ga)),
  });

Product.Traversable = <F, G>(F: Traversable<F>, G: Traversable<G>) =>
  Traversable.of<$<ProductF, [F, G]>>({
    ...Product.Functor(F, G),
    ...Product.Foldable(F, G),

    traverse_:
      <H>(H: Applicative<H>) =>
      <A, B>([fa, ga]: Product<F, G, A>, f: (a: A) => Kind<H, [B]>) =>
        H.product_(F.traverse_(H)(fa, f), G.traverse_(H)(ga, f)),
  });

Product.TraversableFilter = <F, G>(
  F: TraversableFilter<F>,
  G: TraversableFilter<G>,
) =>
  TraversableFilter.of<$<ProductF, [F, G]>>({
    ...Product.Traversable(F, G),

    traverseFilter_:
      <H>(H: Applicative<H>) =>
      <A, B>([fa, ga]: Product<F, G, A>, f: (a: A) => Kind<H, [Option<B>]>) =>
        H.product_(F.traverseFilter_(H)(fa, f), G.traverseFilter_(H)(ga, f)),
  });

Product.Align = <F, G>(F: Align<F>, G: Align<G>) =>
  Align.of<$<ProductF, [F, G]>>({
    ...Product.Functor(F, G),
    align_: ([fa, ga], [fb, gb]) => [F.align_(fa, fb), G.align_(ga, gb)],
  });

Product.Zip = <F, G>(F: Zip<F>, G: Zip<G>) =>
  Zip.of<$<ProductF, [F, G]>>({
    ...Product.Functor(F, G),
    zipWith_: ([fa, ga], [fb, gb], f) => [
      F.zipWith_(fa, fb, f),
      G.zipWith_(ga, gb, f),
    ],
  });

// -- HKT

/**
 * @category Type Constructor
 * @category Data
 */
export interface ProductF extends TyK<[unknown, unknown, unknown]> {
  [$type]: Product<TyVar<this, 0>, TyVar<this, 1>, TyVar<this, 2>>;
}
