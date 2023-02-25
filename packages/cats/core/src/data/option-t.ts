// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, cached, Kind, Lazy, TyK, TyVar } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Alternative } from '../alternative';
import { Applicative } from '../applicative';
import { Defer } from '../defer';
import { EqK } from '../eq-k';
import { Functor } from '../functor';
import { Monad } from '../monad';
import { MonadDefer } from '../monad-defer';
import { MonadError } from '../monad-error';

import { Either, Right } from './either';
import { None, Option, Some } from './option';
import { FunctorFilter } from '../functor-filter';
import { MonadPlus } from '../monad-plus';

export type OptionT<F, A> = Kind<F, [Option<A>]>;
export const OptionT = function <F, A>(
  fa: Kind<F, [Option<A>]>,
): OptionT<F, A> {
  return fa;
};

OptionT.Some =
  <F>(F: Applicative<F>) =>
  <A>(a: A): OptionT<F, A> =>
    F.pure(Some(a));

OptionT.None = <F>(F: Applicative<F>): OptionT<F, never> => F.pure(None);

OptionT.fromNullable =
  <F>(F: Applicative<F>) =>
  <A>(a: A | null | undefined): OptionT<F, A> =>
    F.pure(Option(a));

OptionT.liftF =
  <F>(F: Functor<F>) =>
  <A>(fa: Kind<F, [A]>): OptionT<F, A> =>
    F.map_(fa, Some);

OptionT.isEmpty =
  <F>(F: Functor<F>) =>
  <A>(fa: OptionT<F, A>): Kind<F, [boolean]> =>
    F.map_(fa, opt => opt.isEmpty);
OptionT.nonEmpty =
  <F>(F: Functor<F>) =>
  <A>(fa: OptionT<F, A>): Kind<F, [boolean]> =>
    F.map_(fa, opt => opt.nonEmpty);

OptionT.getOrElse =
  <F>(F: Functor<F>) =>
  <A>(defaultValue: Lazy<A>) =>
  (fa: OptionT<F, A>): Kind<F, [A]> =>
    F.map_(fa, opt => opt.getOrElse(defaultValue));

OptionT.getOrElseF =
  <F>(F: Monad<F>) =>
  <A>(defaultValue: Lazy<Kind<F, [A]>>) =>
  (fa: OptionT<F, A>): Kind<F, [A]> =>
    F.flatMap_(fa, opt => opt.fold(() => defaultValue(), F.pure));

OptionT.fold =
  <F>(F: Functor<F>) =>
  <A, B, C = B>(onNone: () => B, onSome: (a: A) => C) =>
  (fa: OptionT<F, A>): Kind<F, [B | C]> =>
    F.map_(fa, opt => opt.fold(onNone, onSome));

// -- Instances

OptionT.EqK = cached(
  <F>(F: EqK<F>): EqK<$<OptionTF, [F]>> =>
    EqK.of<$<OptionTF, [F]>>({
      liftEq: <A>(E: Eq<A>) => F.liftEq(Option.Eq(E)),
    }),
);

OptionT.Defer = cached(
  <F>(F: Defer<F>): Defer<$<OptionTF, [F]>> =>
    Defer.of<$<OptionTF, [F]>>({ defer: F.defer }),
);

OptionT.Functor = cached(
  <F>(F: Functor<F>): Functor<$<OptionTF, [F]>> =>
    Functor.of<$<OptionTF, [F]>>({
      map_: (fa, f) => F.map_(fa, opt => opt.map(f)),
    }),
);

OptionT.FunctorFilter = cached(
  <F>(F: Functor<F>): FunctorFilter<$<OptionTF, [F]>> =>
    FunctorFilter.of<$<OptionTF, [F]>>({
      ...OptionT.Functor(F),
      mapFilter_: (fa, f) => F.map_(fa, opt => opt.collect(f)),
      filter_: <A>(fa: Kind<F, [Option<A>]>, f: (a: A) => boolean) =>
        F.map_(fa, opt => opt.filter(f)),
      filterNot_: (fa, f) => F.map_(fa, opt => opt.filterNot(f)),
    }),
);

OptionT.Applicative = cached(
  <F>(F: Applicative<F>): Applicative<$<OptionTF, [F]>> =>
    Applicative.of<$<OptionTF, [F]>>({
      pure: a => F.pure(Some(a)),
      ap_: (ff, fa) =>
        F.map2_(ff, fa, (f, a) =>
          f.nonEmpty && a.nonEmpty ? Some(f.get(a.get)) : None,
        ),
      map2_: (fa, fb, f) => F.map2_(fa, fb, (a, b) => a.map2(b, f)),
    }),
);

OptionT.Alternative = cached(
  <F>(F: Applicative<F>): Alternative<$<OptionTF, [F]>> =>
    Alternative.of<$<OptionTF, [F]>>({
      ...OptionT.Applicative(F),
      emptyK: <A>() => F.pure<Option<A>>(None),
      combineK_: (fx, fy) => F.map2_(fx, fy, (x, y) => x.orElse(() => y)),
    }),
);

OptionT.Monad = cached(
  <F>(F: Monad<F>): Monad<$<OptionTF, [F]>> =>
    Monad.of<$<OptionTF, [F]>>({
      ...OptionT.Functor(F),
      pure: a => F.pure(Some(a)),
      flatMap_: (fa, f) =>
        F.flatMap_(fa, opt => opt.fold(() => F.pure(None), f)),
      tailRecM_: <A, B>(
        a0: A,
        f: (a: A) => OptionT<F, Either<A, B>>,
      ): OptionT<F, B> =>
        F.tailRecM(a0)(a =>
          F.map_(f(a), opt =>
            opt.fold(
              () => Right(None),
              a => a.map(Some),
            ),
          ),
        ),
    }),
);

OptionT.MonadPlus = cached(
  <F>(F: Monad<F>): MonadPlus<$<OptionTF, [F]>> =>
    MonadPlus.of<$<OptionTF, [F]>>({
      ...OptionT.Monad(F),
      ...OptionT.FunctorFilter(F),
      ...OptionT.Alternative(F),
    }),
);

OptionT.MonadDefer = cached(
  <F>(F: MonadDefer<F>): MonadDefer<$<OptionTF, [F]>> =>
    MonadDefer.of<$<OptionTF, [F]>>({
      ...OptionT.Monad(F),
      ...OptionT.Defer(F),
    }),
);

OptionT.MonadError = cached(
  <F, E>(F: MonadError<F, E>): MonadError<$<OptionTF, [F]>, E> =>
    MonadError.of<$<OptionTF, [F]>, E>({
      ...OptionT.Monad(F),
      throwError: F.throwError,
      handleErrorWith_: F.handleErrorWith_,
    }),
);

// -- HKT

/**
 * @category Type Constructor
 * @category Data
 */
export interface OptionTF extends TyK<[unknown, unknown]> {
  [$type]: OptionT<TyVar<this, 0>, TyVar<this, 1>>;
}
