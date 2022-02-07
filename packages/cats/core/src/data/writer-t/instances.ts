// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Kind, tupled } from '@fp4ts/core';
import { Eq, Monoid, Semigroup } from '@fp4ts/cats-kernel';
import { Functor } from '../../functor';
import { Contravariant } from '../../contravariant';
import { Bifunctor } from '../../bifunctor';
import { Apply } from '../../apply';
import { FlatMap } from '../../flat-map';
import { Applicative } from '../../applicative';
import { Monad } from '../../monad';
import { ApplicativeError } from '../../applicative-error';
import { MonadError } from '../../monad-error';

import { Either, Left, Right } from '../either';

import {
  ap_,
  bimap_,
  contramap_,
  equals_,
  flatMap_,
  mapWritten_,
  map_,
} from './operators';
import { pure } from './constructors';
import { WriterT } from './algebra';
import type { WriterTK } from './writer-t';

export const writerTEq: <F, L, V>(
  E: Eq<Kind<F, [[L, V]]>>,
) => Eq<WriterT<F, L, V>> = equals_;

export const writerTFunctor: <F, L>(
  F: Functor<F>,
) => Functor<$<WriterTK, [F, L]>> = F => Functor.of({ map_: map_(F) });

export const writerTContravariant: <F, L>(
  F: Contravariant<F>,
) => Contravariant<$<WriterTK, [F, L]>> = F =>
  Contravariant.of({ contramap_: contramap_(F) });

export const writerTBifunctor: <F>(
  F: Functor<F>,
) => Bifunctor<$<WriterTK, [F]>> = F =>
  Bifunctor.of({ bimap_: bimap_(F), map_: map_(F), leftMap_: mapWritten_(F) });

export const writerTApply: <F, L>(
  F: Apply<F>,
  L: Semigroup<L>,
) => Apply<$<WriterTK, [F, L]>> = (F, L) =>
  Apply.of({ ...writerTFunctor(F), ap_: ap_(F, L) });

export const writerTFlatMap: <F, L>(
  F: FlatMap<F>,
  L: Monoid<L>,
) => FlatMap<$<WriterTK, [F, L]>> = <F, L>(F: FlatMap<F>, L: Monoid<L>) =>
  FlatMap.of({
    ...writerTApply(F, L),
    flatMap_: flatMap_(F, L),
    tailRecM_: <S, A>(s: S, f: (s: S) => WriterT<F, L, Either<S, A>>) => {
      const step = ([l1, s]: [L, S]): Kind<F, [Either<[L, S], [L, A]>]> =>
        F.map_(f(s).run, ([l2, sa]) =>
          // prettier-ignore
          sa.fold(
            s => Left(tupled(L.combine_(l1, () => l2), s)),
            a => Right(tupled(L.combine_(l1, () => l2), a)),
          ),
        );

      return new WriterT(F.tailRecM_(tupled(L.empty, s), step));
    },
  });

export const writerTApplicative: <F, L>(
  F: Applicative<F>,
  L: Monoid<L>,
) => Applicative<$<WriterTK, [F, L]>> = (F, L) =>
  Applicative.of({ ...writerTApply(F, L), pure: pure(F, L) });

export const writerTMonad: <F, L>(
  F: Monad<F>,
  L: Monoid<L>,
) => Monad<$<WriterTK, [F, L]>> = (F, L) =>
  Monad.of({ ...writerTFlatMap(F, L), ...writerTApplicative(F, L) });

export const writerTApplicativeError: <F, L, E>(
  F: ApplicativeError<F, E>,
  L: Monoid<L>,
) => ApplicativeError<$<WriterTK, [F, L]>, E> = <F, L, E>(
  F: ApplicativeError<F, E>,
  L: Monoid<L>,
) =>
  ApplicativeError.of({
    ...writerTApplicative(F, L),
    throwError: <V>(e: E) => new WriterT<F, L, V>(F.throwError(e)),
    handleErrorWith_: (fa, h) =>
      new WriterT(F.handleErrorWith_(fa.run, e => h(e).run)),
  });

export const writerTMonadError: <F, L, E>(
  F: MonadError<F, E>,
  L: Monoid<L>,
) => MonadError<$<WriterTK, [F, L]>, E> = (F, L) =>
  MonadError.of({
    ...writerTMonad(F, L),
    ...writerTApplicativeError(F, L),
  });
