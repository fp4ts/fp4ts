// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, fst, Kind, tupled, TyK, TyVar } from '@fp4ts/core';
import { Eq, Monoid, Semigroup } from '@fp4ts/cats-kernel';
import {
  Applicative,
  ApplicativeError,
  Apply,
  Contravariant,
  Functor,
  FlatMap,
  Monad,
  MonadError,
  Eval,
  SemigroupK,
  MonoidK,
  Alternative,
  CoflatMap,
  Comonad,
  Defer,
  Foldable,
  Traversable,
  EqK,
} from '@fp4ts/cats-core';
import { Left, Right, Tuple2 } from '@fp4ts/cats-core/lib/data';
import { MonadWriter } from '../monad-writer';

export type WriterT<F, W, A> = Kind<F, [[A, W]]>;
export const WriterT = function <F, W, A>(fwa: Kind<F, [[A, W]]>) {
  return fwa;
};

WriterT.listen =
  <F>(F: Functor<F>) =>
  <W, A>(fwa: WriterT<F, W, A>): WriterT<F, W, [A, W]> =>
    F.map_(fwa, ([a, w]) => [[a, w], w]);
WriterT.tell =
  <F>(F: Applicative<F>) =>
  <W>(w: W): WriterT<F, W, void> =>
    F.pure([undefined, w]);
WriterT.censor =
  <F>(F: Functor<F>) =>
  <W1, W2>(f: (w1: W1) => W2) =>
  <A>(fwa: WriterT<F, W1, A>): WriterT<F, W2, A> =>
    WriterT.censor_(F)(fwa, f);
WriterT.censor_ =
  <F>(F: Functor<F>) =>
  <W1, W2, A>(fwa: WriterT<F, W1, A>, f: (w1: W1) => W2): WriterT<F, W2, A> =>
    F.map_(fwa, ([a, w1]) => [a, f(w1)]);

WriterT.EqK = <F, W>(F: EqK<F>, W: Eq<W>): EqK<$<WriterTF, [F, W]>> =>
  EqK.of<$<WriterTF, [F, W]>>({
    liftEq: <A>(A: Eq<A>) => F.liftEq(Eq.tuple(A, W)),
  });

WriterT.Defer = <F, W>(F: Defer<F>): Defer<$<WriterTF, [F, W]>> =>
  Defer.of<$<WriterTF, [F, W]>>({ defer: F.defer });

WriterT.Functor = <F, W>(F: Functor<F>): Functor<$<WriterTF, [F, W]>> =>
  Functor.of({ map_: (fa, f) => F.map_(fa, Tuple2.Bifunctor.leftMap(f)) });

WriterT.Apply = <F, W>(
  F: Apply<F>,
  W: Semigroup<W>,
): Apply<$<WriterTF, [F, W]>> =>
  Apply.of<$<WriterTF, [F, W]>>({
    ...WriterT.Functor(F),
    ap_: (ff, fa) =>
      F.map2_(ff, fa)(([f, w1], [a, w2]) => [f(a), W.combine_(w1, () => w2)]),
    map2_:
      <A, B>(fa: WriterT<F, W, A>, fb: WriterT<F, W, B>) =>
      <C>(f: (a: A, b: B) => C) =>
        F.map2_(
          fa,
          fb,
        )(([a, w1], [b, w2]) => [f(a, b), W.combine_(w1, () => w2)]),
    map2Eval_:
      <A, B>(fa: WriterT<F, W, A>, efb: Eval<WriterT<F, W, B>>) =>
      <C>(f: (a: A, b: B) => C) =>
        F.map2Eval_(
          fa,
          efb,
        )(([a, w1], [b, w2]) => [f(a, b), W.combine_(w1, () => w2)]),
  });

WriterT.FlatMap1 = <F, W>(
  F: FlatMap<F>,
  W: Monoid<W>,
): FlatMap<$<WriterTF, [F, W]>> =>
  FlatMap.of<$<WriterTF, [F, W]>>({
    ...WriterT.Apply(F, W),
    flatMap_: (fa, f) =>
      F.flatMap_(fa, ([a, w1]) =>
        F.map_(f(a), ([b, w2]) => [b, W.combine_(w1, () => w2)]),
      ),
    tailRecM_: (s, f) =>
      F.tailRecM_(tupled(s, W.empty), ([a, w1]) =>
        F.map_(f(a), ([ea, w2]) =>
          ea.fold(
            a =>
              Left(
                tupled(
                  a,
                  W.combine_(w1, () => w2),
                ),
              ),
            b =>
              Right(
                tupled(
                  b,
                  W.combine_(w1, () => w2),
                ),
              ),
          ),
        ),
      ),
  });

WriterT.FlatMap2 = <F, W>(
  F: Monad<F>,
  W: Semigroup<W>,
): FlatMap<$<WriterTF, [F, W]>> =>
  FlatMap.of<$<WriterTF, [F, W]>>({
    ...WriterT.Apply(F, W),
    flatMap_: (fa, f) =>
      F.flatMap_(fa, ([a, w1]) =>
        F.map_(f(a), ([b, w2]) => [b, W.combine_(w1, () => w2)]),
      ),
    tailRecM_: (s, f) =>
      F.flatMap_(f(s), ([ea, w]) =>
        ea.fold(
          s =>
            F.tailRecM_(tupled(s, w), ([a, w1]) =>
              F.map_(f(a), ([ea, w2]) =>
                ea.fold(
                  a =>
                    Left(
                      tupled(
                        a,
                        W.combine_(w1, () => w2),
                      ),
                    ),
                  b =>
                    Right(
                      tupled(
                        b,
                        W.combine_(w1, () => w2),
                      ),
                    ),
                ),
              ),
            ),
          b => F.pure([b, w]),
        ),
      ),
  });

WriterT.Applicative = <F, W>(
  F: Applicative<F>,
  W: Monoid<W>,
): Applicative<$<WriterTF, [F, W]>> =>
  Applicative.of<$<WriterTF, [F, W]>>({
    ...WriterT.Apply(F, W),
    pure: a => F.pure([a, W.empty]),
  });

WriterT.ApplicativeError = <F, W, E>(
  F: ApplicativeError<F, E>,
  W: Monoid<W>,
): ApplicativeError<$<WriterTF, [F, W]>, E> =>
  ApplicativeError.of<$<WriterTF, [F, W]>, E>({
    ...WriterT.Applicative(F, W),
    throwError: F.throwError,
    handleErrorWith_: (fa, f) => F.handleErrorWith_(fa, f),
  });

WriterT.Monad = <F, W>(F: Monad<F>, W: Monoid<W>): Monad<$<WriterTF, [F, W]>> =>
  Monad.of<$<WriterTF, [F, W]>>({
    ...WriterT.Applicative(F, W),
    ...WriterT.FlatMap1(F, W),
  });

WriterT.MonadError = <F, W, E>(
  F: MonadError<F, E>,
  W: Monoid<W>,
): MonadError<$<WriterTF, [F, W]>, E> =>
  MonadError.of<$<WriterTF, [F, W]>, E>({
    ...WriterT.ApplicativeError(F, W),
    ...WriterT.Monad(F, W),
  });

WriterT.MonadWriter = <F, W>(
  F: Monad<F>,
  W: Monoid<W>,
): MonadWriter<$<WriterTF, [F, W]>, W> =>
  MonadWriter.of<$<WriterTF, [F, W]>, W>({
    monoid: W,
    ...WriterT.Monad(F, W),
    tell: WriterT.tell(F),
    listen: WriterT.listen(F),
    censor_: WriterT.censor_(F),
  });

WriterT.SemigroupK = <F, W>(
  F: SemigroupK<F>,
): SemigroupK<$<WriterTF, [F, W]>> =>
  SemigroupK.of<$<WriterTF, [F, W]>>({ combineK_: F.combineK_ });

WriterT.MonoidK = <F, W>(F: MonoidK<F>): MonoidK<$<WriterTF, [F, W]>> =>
  MonoidK.of<$<WriterTF, [F, W]>>({
    combineK_: WriterT.SemigroupK<F, W>(F).combineK_,
    emptyK: <A>() => F.emptyK<[A, W]>(),
  });

WriterT.Alternative = <F, W>(
  F: Alternative<F>,
  W: Monoid<W>,
): Alternative<$<WriterTF, [F, W]>> =>
  Alternative.of<$<WriterTF, [F, W]>>({
    ...WriterT.Applicative(F, W),
    ...WriterT.MonoidK<F, W>(F),
  });

WriterT.Contravariant = <F, W>(
  F: Contravariant<F>,
): Contravariant<$<WriterTF, [F, W]>> =>
  Contravariant.of<$<WriterTF, [F, W]>>({
    contramap_: (fa, f) => F.contramap_(fa, Tuple2.Bifunctor.leftMap(f)),
  });

WriterT.CoflatMap = <F, W>(F: Functor<F>): CoflatMap<$<WriterTF, [F, W]>> => {
  const WF = WriterT.Functor<F, W>(F);
  return CoflatMap.of<$<WriterTF, [F, W]>>({
    ...WF,
    coflatMap_: (fa, f) => WF.map_(fa, () => f(fa)),
  });
};

WriterT.Comonad = <F, W>(F: Comonad<F>): Comonad<$<WriterTF, [F, W]>> =>
  Comonad.of<$<WriterTF, [F, W]>>({
    ...WriterT.CoflatMap(F),
    extract: fa => F.extract(F.map_(fa, fst)),
  });

WriterT.Foldable = <F, W>(F: Foldable<F>): Foldable<$<WriterTF, [F, W]>> =>
  Foldable.of<$<WriterTF, [F, W]>>({
    foldRight_: (fwa, ez, f) => F.foldRight_(fwa, ez, ([a, w], eb) => f(a, eb)),
  });

WriterT.Traversable = <F, W>(
  F: Traversable<F>,
): Traversable<$<WriterTF, [F, W]>> =>
  Traversable.of<$<WriterTF, [F, W]>>({
    ...WriterT.Foldable<F, W>(F),
    traverse_: G => (fwa, f) =>
      F.traverse_(G)(fwa, ([a, w]) => G.tupleRight_(f(a), w)),
  });

// -- HKT

/**
 * @category Type Constructor
 * @category Data
 */
export interface WriterTF extends TyK<[unknown, unknown, unknown]> {
  [$type]: WriterT<TyVar<this, 0>, TyVar<this, 1>, TyVar<this, 2>>;
}
