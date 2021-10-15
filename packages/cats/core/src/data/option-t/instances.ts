import { $ } from '@cats4ts/core';
import { SemigroupK } from '../../semigroup-k';
import { MonoidK } from '../../monoid-k';
import { Functor } from '../../functor';
import { Apply } from '../../apply';
import { Applicative } from '../../applicative';
import { Alternative } from '../../alternative';
import { FlatMap } from '../../flat-map';
import { Monad } from '../../monad';

import { OptionTK } from './option-t';

import { flatMap_, map_, orElse_, tailRecM_ } from './operators';
import { none, pure } from './constructors';

export const optionTSemigroupK: <F>(
  F: Monad<F>,
) => SemigroupK<$<OptionTK, [F]>> = F =>
  SemigroupK.of({
    combineK_: orElse_(F),
  });

export const optionTMonoidK: <F>(F: Monad<F>) => MonoidK<$<OptionTK, [F]>> =
  F =>
    MonoidK.of({
      combineK_: orElse_(F),
      emptyK: () => none(F),
    });

export const optionTFunctor: <F>(F: Functor<F>) => Functor<$<OptionTK, [F]>> =
  F =>
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

export const optionTFlatMap: <F>(F: Monad<F>) => FlatMap<$<OptionTK, [F]>> =
  F => Monad.deriveFlatMap(optionTMonad(F));

export const optionTMonad: <F>(F: Monad<F>) => Monad<$<OptionTK, [F]>> = F =>
  Monad.of({
    flatMap_: flatMap_(F),
    pure: pure(F),
    tailRecM_: tailRecM_(F),
  });
