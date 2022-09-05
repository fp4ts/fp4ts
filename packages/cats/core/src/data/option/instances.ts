// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Lazy, lazyVal } from '@fp4ts/core';
import { Eq, Monoid } from '@fp4ts/cats-kernel';
import { Eval } from '../../eval';
import { EqK } from '../../eq-k';
import { SemigroupK } from '../../semigroup-k';
import { MonoidK } from '../../monoid-k';
import { Apply } from '../../apply';
import { Applicative } from '../../applicative';
import { Alternative } from '../../alternative';
import { Functor } from '../../functor';
import { FunctorFilter } from '../../functor-filter';
import { FlatMap } from '../../flat-map';
import { CoflatMap } from '../../coflat-map';
import { Monad } from '../../monad';
import { Foldable } from '../../foldable';
import { Traversable } from '../../traversable';

import { OptionF } from './option';
import {
  equals_,
  filter_,
  flatMap_,
  flatTap_,
  flatten,
  map_,
  orElse_,
  tailRecM_,
  traverse_,
} from './operators';
import { none, pure } from './constructors';
import { Option } from './option';

export const optionEq = <A>(E: Eq<A>): Eq<Option<A>> =>
  Eq.of({ equals: equals_(E) });

export const optionEqK: Lazy<EqK<OptionF>> = lazyVal(() =>
  EqK.of({ liftEq: optionEq }),
);

export const optionSemigroupK: Lazy<SemigroupK<OptionF>> = lazyVal(() =>
  SemigroupK.of({ combineK_: orElse_ }),
);

export const optionMonoidK: Lazy<MonoidK<OptionF>> = lazyVal(() =>
  MonoidK.of({ emptyK: () => none, combineK_: orElse_ }),
);

export const optionFunctor: Lazy<Functor<OptionF>> = lazyVal(() =>
  Functor.of({ map_ }),
);

export const optionFunctorFilter: Lazy<FunctorFilter<OptionF>> = lazyVal(() =>
  FunctorFilter.of({ ...optionFunctor(), mapFilter_: flatMap_, filter_ }),
);

export const optionApply: Lazy<Apply<OptionF>> = lazyVal(() =>
  Apply.of({
    ...optionFunctor(),
    ap_: (ff, fa) => (ff === none ? none : map_(fa, ff.get)),
    map2Eval_:
      <A, B>(fa: Option<A>, efb: Eval<Option<B>>) =>
      <C>(f: (a: A, b: B) => C) =>
        fa === none
          ? Eval.now(none)
          : efb.map(fb => map_(fb, b => f(fa.get, b))),
  }),
);

export const optionApplicative: Lazy<Applicative<OptionF>> = lazyVal(() =>
  Applicative.of({
    ...optionApply(),
    pure: pure,
  }),
);

export const optionAlternative: Lazy<Alternative<OptionF>> = lazyVal(() =>
  Alternative.of({
    ...optionApplicative(),
    ...optionMonoidK(),
  }),
);

export const optionFlatMap: Lazy<FlatMap<OptionF>> = lazyVal(() =>
  FlatMap.of({
    ...optionApply(),
    flatMap_: flatMap_,
    flatTap_: flatTap_,
    flatten: flatten,
    tailRecM_: tailRecM_,
  }),
);

export const optionCoflatMap: Lazy<CoflatMap<OptionF>> = lazyVal(() =>
  Applicative.coflatMap(optionApplicative()),
);

export const optionMonad: Lazy<Monad<OptionF>> = lazyVal(() =>
  Monad.of({
    ...optionApplicative(),
    ...optionFlatMap(),
  }),
);

export const optionFoldable: Lazy<Foldable<OptionF>> = lazyVal(() =>
  Foldable.of({
    foldMap_:
      <M>(M: Monoid<M>) =>
      (fa, f) =>
        fa.fold(() => M.empty, f),

    foldRight_: (fa, eb, f) =>
      Eval.defer(() =>
        fa.fold(
          () => eb,
          x => f(x, eb),
        ),
      ),

    foldLeft_: (fa, b, f) =>
      fa.fold(
        () => b,
        x => f(b, x),
      ),
  }),
);

export const optionTraversable: Lazy<Traversable<OptionF>> = lazyVal(() =>
  Traversable.of({
    ...optionFoldable(),
    ...optionFunctor(),
    traverse_,
  }),
);
