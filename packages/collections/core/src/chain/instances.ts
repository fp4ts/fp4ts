// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eval, Lazy, lazy } from '@fp4ts/core';
import {
  Align,
  Alternative,
  CoflatMap,
  Eq,
  Functor,
  FunctorFilter,
  Monad,
  MonadPlus,
  MonoidK,
  TraversableFilter,
} from '@fp4ts/cats';

import type { ChainF } from './chain';
import { Chain } from './algebra';
import {
  align_,
  coflatMap_,
  collect_,
  concat_,
  equals_,
  filter_,
  flatMap_,
  foldLeft_,
  foldMapK_,
  foldMapLeft_,
  foldMap_,
  foldRightEval_,
  map_,
  traverseFilter_,
  traverse_,
} from './operators';
import { empty, pure, tailRecM_ } from './constructors';

export const chainEq = <A>(E: Eq<A>): Eq<Chain<A>> =>
  Eq.of({ equals: equals_(E) });

export const chainAlign: Lazy<Align<ChainF>> = lazy(() =>
  Align.of({ ...chainFunctor(), align_: align_ }),
);

export const chainMonoidK: Lazy<MonoidK<ChainF>> = lazy(() =>
  MonoidK.of({ emptyK: () => empty, combineK_: (xs, ys) => concat_(xs, ys) }),
);

export const chainFunctor: Lazy<Functor<ChainF>> = lazy(() =>
  Functor.of({ map_ }),
);

export const chainFunctorFilter: Lazy<FunctorFilter<ChainF>> = lazy(() =>
  FunctorFilter.of({
    ...chainFunctor(),
    mapFilter_: collect_,
    collect_,
    filter_: filter_,
  }),
);

export const chainAlternative: Lazy<Alternative<ChainF>> = lazy(() =>
  Alternative.of({ ...chainMonad(), ...chainMonoidK() }),
);

export const chainCoflatMap: Lazy<CoflatMap<ChainF>> = lazy(() =>
  CoflatMap.of({ ...chainFunctor(), coflatMap_ }),
);

export const chainMonad: Lazy<Monad<ChainF>> = lazy(() =>
  Monad.of({
    pure: pure,
    flatMap_: flatMap_,
    tailRecM_: tailRecM_,
    map_: map_,
    map2Eval_: (fa, efb, f) =>
      fa === empty
        ? Eval.now(empty)
        : efb.map(fb => flatMap_(fa, a => map_(fb, b => f(a, b)))),
  }),
);

export const chainMonadPlus: Lazy<MonadPlus<ChainF>> = lazy(() =>
  MonadPlus.of({
    ...chainMonad(),
    ...chainAlternative(),
    ...chainFunctorFilter(),
  }),
);

export const chainTraversable: Lazy<TraversableFilter<ChainF>> = lazy(() =>
  TraversableFilter.of({
    ...chainFunctorFilter(),
    foldLeft_,
    foldRight_: foldRightEval_,
    foldMap_,
    foldMapLeft_,
    foldMapK_,
    traverse_,
    traverseFilter_,
  }),
);
