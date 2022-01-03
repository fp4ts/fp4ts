// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Lazy, lazyVal } from '@fp4ts/core';
import { Eq } from '../../eq';
import { SemigroupK } from '../../semigroup-k';
import { MonoidK } from '../../monoid-k';
import { Apply } from '../../apply';
import { Applicative } from '../../applicative';
import { Alternative } from '../../alternative';
import { Functor } from '../../functor';
import { FunctorFilter } from '../../functor-filter';
import { FlatMap } from '../../flat-map';
import { Monad } from '../../monad';

import { OptionK } from './option';
import {
  equals_,
  flatMap_,
  flatTap_,
  flatten,
  map_,
  orElse_,
  tailRecM_,
} from './operators';
import { none, pure } from './constructors';
import { Option } from './option';

export const optionEq = <A>(E: Eq<A>): Eq<Option<A>> =>
  Eq.of({ equals: equals_(E) });

export const optionSemigroupK: Lazy<SemigroupK<OptionK>> = lazyVal(() =>
  SemigroupK.of({ combineK_: orElse_ }),
);

export const optionMonoidK: Lazy<MonoidK<OptionK>> = lazyVal(() =>
  MonoidK.of({ emptyK: () => none, combineK_: orElse_ }),
);

export const optionFunctor: Lazy<Functor<OptionK>> = lazyVal(() =>
  Functor.of({ map_ }),
);

export const optionFunctorFilter: Lazy<FunctorFilter<OptionK>> = lazyVal(() =>
  FunctorFilter.of({ ...optionFunctor(), mapFilter_: flatMap_ }),
);

export const optionApply: Lazy<Apply<OptionK>> = lazyVal(() =>
  Apply.of({
    ...optionFunctor(),
    ap_: (ff, fa) => flatMap_(ff, f => map_(fa, a => f(a))),
  }),
);

export const optionApplicative: Lazy<Applicative<OptionK>> = lazyVal(() =>
  Applicative.of({
    ...optionApply(),
    pure: pure,
  }),
);

export const optionAlternative: Lazy<Alternative<OptionK>> = lazyVal(() =>
  Alternative.of({
    ...optionApplicative(),
    ...optionMonoidK(),
  }),
);

export const optionFlatMap: Lazy<FlatMap<OptionK>> = lazyVal(() =>
  FlatMap.of({
    ...optionApply(),
    flatMap_: flatMap_,
    flatTap_: flatTap_,
    flatten: flatten,
    tailRecM_: tailRecM_,
  }),
);

export const optionMonad: Lazy<Monad<OptionK>> = lazyVal(() =>
  Monad.of({
    ...optionApplicative(),
    ...optionFlatMap(),
  }),
);
