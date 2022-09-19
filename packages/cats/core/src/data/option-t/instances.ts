// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
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
import { OptionTF } from './option-t';

import { flatMap_, map_, orElse_, tailRecM_ } from './operators';
import { none, pure } from './constructors';

export const optionTEq = <F, A>(
  EF: Eq<Kind<F, [Option<A>]>>,
): Eq<OptionT<F, A>> => Eq.by(EF, opt => opt.value);

export const optionTDefer: <F>(F: Defer<F>) => Defer<$<OptionTF, [F]>> = F =>
  Defer.of({ defer: fa => new OptionT(F.defer(() => fa().value)) });

export const optionTSemigroupK: <F>(
  F: Monad<F>,
) => SemigroupK<$<OptionTF, [F]>> = <F>(F: Monad<F>) =>
  SemigroupK.of<$<OptionTF, [F]>>({ combineK_: orElse_(F) });

export const optionTMonoidK: <F>(F: Monad<F>) => MonoidK<$<OptionTF, [F]>> = <
  F,
>(
  F: Monad<F>,
) =>
  MonoidK.of<$<OptionTF, [F]>>({
    combineK_: orElse_(F),
    emptyK: () => none(F),
  });

export const optionTFunctor: <F>(F: Functor<F>) => Functor<$<OptionTF, [F]>> = <
  F,
>(
  F: Functor<F>,
) => Functor.of<$<OptionTF, [F]>>({ map_: map_(F) });

export const optionTApply: <F>(F: Monad<F>) => Apply<$<OptionTF, [F]>> = F =>
  Monad.deriveApply(optionTMonad(F));

export const optionTApplicative: <F>(
  F: Monad<F>,
) => Applicative<$<OptionTF, [F]>> = F =>
  Monad.deriveApplicative(optionTMonad(F));

export const optionTAlternative: <F>(
  F: Monad<F>,
) => Alternative<$<OptionTF, [F]>> = F =>
  Alternative.of({
    ...optionTMonoidK(F),
    ...optionTApplicative(F),
  });

export const optionTFlatMap: <F>(
  F: Monad<F>,
) => FlatMap<$<OptionTF, [F]>> = F => Monad.deriveFlatMap(optionTMonad(F));

export const optionTMonad: <F>(F: Monad<F>) => Monad<$<OptionTF, [F]>> = <F>(
  F: Monad<F>,
) =>
  Monad.of<$<OptionTF, [F]>>({
    flatMap_: flatMap_(F),
    pure: pure(F),
    tailRecM_: tailRecM_(F),
  });

export const optionTMonadError: <F, E>(
  F: MonadError<F, E>,
) => MonadError<$<OptionTF, [F]>, E> = F =>
  MonadError.of({
    ...optionTMonad(F),
    throwError: e => new OptionT(F.map_(F.throwError(e), Some)),
    handleErrorWith_: (fa, h) =>
      new OptionT(F.handleErrorWith_(fa.value, e => h(e).value)),
  });
