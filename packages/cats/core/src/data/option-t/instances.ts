import { AnyK, $ } from '@cats4ts/core';

import {
  SemigroupK,
  MonoidK,
  Functor,
  Apply,
  Applicative,
  FlatMap,
  Monad,
} from '@cats4ts/cats-core';

import { OptionTK } from './option-t';

import { flatMap_, map_, orElse_, tailRecM_ } from './operators';
import { none, pure } from './constructors';
import { Alternative } from '../../alternative';

export const optionTSemigroupK: <F extends AnyK>(
  F: Monad<F>,
) => SemigroupK<$<OptionTK, [F]>> = F =>
  SemigroupK.of({
    combineK_: orElse_(F),
  });

export const optionTMonoidK: <F extends AnyK>(
  F: Monad<F>,
) => MonoidK<$<OptionTK, [F]>> = F =>
  MonoidK.of({
    combineK_: orElse_(F),
    emptyK: () => none(F),
  });

export const optionTFunctor: <F extends AnyK>(
  F: Functor<F>,
) => Functor<$<OptionTK, [F]>> = F =>
  Functor.of({
    map_: map_(F),
  });

export const optionTApply: <F extends AnyK>(
  F: Monad<F>,
) => Apply<$<OptionTK, [F]>> = F => Monad.deriveApply(optionTMonad(F));

export const optionTApplicative: <F extends AnyK>(
  F: Monad<F>,
) => Applicative<$<OptionTK, [F]>> = F =>
  Monad.deriveApplicative(optionTMonad(F));

export const optionTAlternative: <F extends AnyK>(
  F: Monad<F>,
) => Alternative<$<OptionTK, [F]>> = F =>
  Alternative.of({
    ...optionTMonoidK(F),
    ...optionTApplicative(F),
  });

export const optionTFlatMap: <F extends AnyK>(
  F: Monad<F>,
) => FlatMap<$<OptionTK, [F]>> = F => Monad.deriveFlatMap(optionTMonad(F));

export const optionTMonad: <F extends AnyK>(
  F: Monad<F>,
) => Monad<$<OptionTK, [F]>> = F =>
  Monad.of({
    flatMap_: flatMap_(F),
    pure: pure(F),
    tailRecM_: tailRecM_(F),
  });
