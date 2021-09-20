import { Lazy } from '@cats4ts/core';
import { SemigroupK } from '../../semigroup-k';
import { MonoidK } from '../../monoid-k';
import { Apply } from '../../apply';
import { Applicative } from '../../applicative';
import { Alternative } from '../../alternative';
import { Functor } from '../../functor';
import { FlatMap } from '../../flat-map';
import { Monad } from '../../monad';

import { OptionK } from './option';
import {
  flatMap_,
  flatTap_,
  flatten,
  map_,
  orElse_,
  tailRecM_,
} from './operators';
import { none, pure } from './constructors';

export const optionSemigroupK: Lazy<SemigroupK<OptionK>> = () =>
  SemigroupK.of({ combineK_: orElse_ });

export const optionMonoidK: Lazy<MonoidK<OptionK>> = () =>
  MonoidK.of({ emptyK: () => none, combineK_: orElse_ });

export const optionFunctor: Lazy<Functor<OptionK>> = () => Functor.of({ map_ });

export const optionApply: Lazy<Apply<OptionK>> = () =>
  Apply.of({
    ...optionFunctor(),
    ap_: (ff, fa) => flatMap_(ff, f => map_(fa, a => f(a))),
  });

export const optionApplicative: Lazy<Applicative<OptionK>> = () =>
  Applicative.of({
    ...optionApply(),
    pure: pure,
  });

export const optionAlternative: Lazy<Alternative<OptionK>> = () =>
  Alternative.of({
    ...optionApplicative(),
    ...optionMonoidK(),
  });

export const optionFlatMap: Lazy<FlatMap<OptionK>> = () =>
  FlatMap.of({
    ...optionApply(),
    flatMap_: flatMap_,
    flatTap_: flatTap_,
    flatten: flatten,
    tailRecM_: tailRecM_,
  });

export const optionMonad: Lazy<Monad<OptionK>> = () =>
  Monad.of({
    ...optionApplicative(),
    ...optionFlatMap(),
  });
