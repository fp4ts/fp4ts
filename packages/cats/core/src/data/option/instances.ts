import { Lazy } from '@cats4ts/core';
import {
  SemigroupK,
  MonoidK,
  Apply,
  Applicative,
  Alternative,
  Functor,
  FlatMap,
  Monad,
} from '@cats4ts/cats-core';

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
