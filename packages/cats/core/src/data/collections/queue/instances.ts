// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eval, Lazy, lazy } from '@fp4ts/core';
import { Align } from '../../../align';
import { Apply } from '../../../apply';
import { Applicative } from '../../../applicative';
import { Alternative } from '../../../alternative';
import { FlatMap } from '../../../flat-map';
import { CoflatMap } from '../../../coflat-map';
import { Functor } from '../../../functor';
import { FunctorFilter } from '../../../functor-filter';
import { Foldable } from '../../../foldable';
import { Monad } from '../../../monad';
import { MonoidK } from '../../../monoid-k';
import { SemigroupK } from '../../../semigroup-k';
import { TraversableFilter } from '../../../traversable-filter';

import { empty, pure, tailRecM_ } from './constructors';
import {
  align_,
  all_,
  any_,
  coflatMap_,
  collect_,
  concat_,
  count_,
  elemOption_,
  flatMap_,
  foldLeft_,
  foldMapK_,
  foldMapLeft_,
  foldMap_,
  foldRightEval_,
  isEmpty,
  iterator,
  map_,
  nonEmpty,
  size,
  traverseFilter_,
  traverse_,
  view,
  zipAll_,
} from './operators';
import type { Queue, QueueF } from './queue';

export const queueSemigroupK: Lazy<SemigroupK<QueueF>> = lazy(() =>
  queueMonoidK(),
);

export const queueMonoidK: Lazy<MonoidK<QueueF>> = lazy(() =>
  MonoidK.of({
    emptyK: () => empty,
    combineK_: (x, y) => concat_(x, y),
    combineKEval_: (x, ey) => (isEmpty(x) ? ey : ey.map(y => concat_(x, y))),
  }),
);

export const queueAlign: Lazy<Align<QueueF>> = lazy(() =>
  Align.of({
    ...queueFunctor(),
    align_: align_,
    zipAll: (xs, ys, a, b) =>
      zipAll_(
        xs,
        ys,
        () => a,
        () => b,
      ),
  }),
);

export const queueFunctor: Lazy<Functor<QueueF>> = lazy(() =>
  Functor.of({ map_ }),
);

export const queueFunctorFilter: Lazy<FunctorFilter<QueueF>> = lazy(() =>
  FunctorFilter.of({ ...queueFunctor(), mapFilter_: collect_ }),
);

export const queueApply: Lazy<Apply<QueueF>> = lazy(() => queueMonad());

export const queueApplicative: Lazy<Applicative<QueueF>> = lazy(() =>
  queueMonad(),
);

export const queueFlatMap: Lazy<FlatMap<QueueF>> = lazy(() => queueMonad());

export const queueCoflatMap: Lazy<CoflatMap<QueueF>> = lazy(() =>
  CoflatMap.of({ ...queueFunctor(), coflatMap_ }),
);

export const queueAlternative: Lazy<Alternative<QueueF>> = lazy(() =>
  Alternative.of({ ...queueMonad(), ...queueMonoidK() }),
);

export const queueMonad: Lazy<Monad<QueueF>> = lazy(() =>
  Monad.of({
    pure,
    flatMap_,
    tailRecM_,
    map2Eval_:
      <A, B>(fa: Queue<A>, efb: Eval<Queue<B>>) =>
      <C>(f: (a: A, b: B) => C) =>
        isEmpty(fa)
          ? Eval.now(empty)
          : efb.map(fb => flatMap_(fa, a => map_(fb, b => f(a, b)))),
  }),
);

export const queueFoldable: Lazy<Foldable<QueueF>> = lazy(() =>
  Foldable.of({
    isEmpty,
    nonEmpty,
    size,
    all_,
    any_,
    count_,
    foldMap_,
    foldMapLeft_,
    foldMapK_,
    foldLeft_,
    foldRight_: foldRightEval_,
    elem_: elemOption_,
    iterator,
    view,
  }),
);

export const queueTraversableFilter: Lazy<TraversableFilter<QueueF>> = lazy(
  () =>
    TraversableFilter.of({
      ...queueFoldable(),
      ...queueFunctorFilter(),
      traverse_,
      traverseFilter_,
    }),
);
