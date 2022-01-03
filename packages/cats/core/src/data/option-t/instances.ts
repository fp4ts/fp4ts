// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Kind } from '@fp4ts/core';
import { Eq } from '../../eq';
import { Defer } from '../../defer';
import { SemigroupK } from '../../semigroup-k';
import { MonoidK } from '../../monoid-k';
import { Functor } from '../../functor';
import { Apply } from '../../apply';
import { Applicative } from '../../applicative';
import { Alternative } from '../../alternative';
import { FlatMap } from '../../flat-map';
import { Monad } from '../../monad';
import { MonadError } from '../../monad-error';

import { Some, Option } from '../option';

import { OptionT } from './algebra';
import { OptionTK } from './option-t';

import { flatMap_, map_, orElse_, tailRecM_ } from './operators';
import { none, pure } from './constructors';

export const optionTEq = <F, A>(
  EF: Eq<Kind<F, [Option<A>]>>,
): Eq<OptionT<F, A>> => Eq.by(EF, opt => opt.value);

export const optionTDefer: <F>(F: Defer<F>) => Defer<$<OptionTK, [F]>> = F =>
  Defer.of({ defer: fa => new OptionT(F.defer(() => fa().value)) });

export const optionTSemigroupK: <F>(
  F: Monad<F>,
) => SemigroupK<$<OptionTK, [F]>> = F =>
  SemigroupK.of({
    combineK_: orElse_(F),
  });

export const optionTMonoidK: <F>(
  F: Monad<F>,
) => MonoidK<$<OptionTK, [F]>> = F =>
  MonoidK.of({
    combineK_: orElse_(F),
    emptyK: () => none(F),
  });

export const optionTFunctor: <F>(
  F: Functor<F>,
) => Functor<$<OptionTK, [F]>> = F =>
  Functor.of({
    map_: map_(F),
  });

export const optionTApply: <F>(F: Monad<F>) => Apply<$<OptionTK, [F]>> = F =>
  Monad.deriveApply(optionTMonad(F));

export const optionTApplicative: <F>(
  F: Monad<F>,
) => Applicative<$<OptionTK, [F]>> = F =>
  Monad.deriveApplicative(optionTMonad(F));

export const optionTAlternative: <F>(
  F: Monad<F>,
) => Alternative<$<OptionTK, [F]>> = F =>
  Alternative.of({
    ...optionTMonoidK(F),
    ...optionTApplicative(F),
  });

export const optionTFlatMap: <F>(
  F: Monad<F>,
) => FlatMap<$<OptionTK, [F]>> = F => Monad.deriveFlatMap(optionTMonad(F));

export const optionTMonad: <F>(F: Monad<F>) => Monad<$<OptionTK, [F]>> = F =>
  Monad.of({
    flatMap_: flatMap_(F),
    pure: pure(F),
    tailRecM_: tailRecM_(F),
  });

export const optionTMonadError: <F, E>(
  F: MonadError<F, E>,
) => MonadError<$<OptionTK, [F]>, E> = F =>
  MonadError.of({
    ...optionTMonad(F),
    throwError: e => new OptionT(F.map_(F.throwError(e), Some)),
    handleErrorWith_: (fa, h) =>
      new OptionT(F.handleErrorWith_(fa.value, e => h(e).value)),
  });
