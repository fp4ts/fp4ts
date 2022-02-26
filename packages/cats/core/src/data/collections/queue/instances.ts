// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Lazy, lazyVal } from '@fp4ts/core';
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
import { Traversable } from '../../../traversable';
import { Eval } from '../../../eval';

import { empty, pure, tailRecM_ } from './constructors';
import {
  align_,
  all_,
  any_,
  coflatMap_,
  collect_,
  concat_,
  count_,
  dequeue,
  elemOption_,
  flatMap_,
  foldLeft_,
  foldMap_,
  isEmpty,
  iterator,
  map_,
  nonEmpty,
  size,
  traverse_,
  zipAll_,
} from './operators';
import type { Queue, QueueF } from './queue';

export const queueSemigroupK: Lazy<SemigroupK<QueueF>> = lazyVal(() =>
  queueMonoidK(),
);

export const queueMonoidK: Lazy<MonoidK<QueueF>> = lazyVal(() =>
  MonoidK.of({ emptyK: () => empty, combineK_: (x, y) => concat_(x, y()) }),
);

export const queueAlign: Lazy<Align<QueueF>> = lazyVal(() =>
  Align.of({
    functor: queueFunctor(),
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

export const queueFunctor: Lazy<Functor<QueueF>> = lazyVal(() =>
  Functor.of({ map_ }),
);

export const queueFunctorFilter: Lazy<FunctorFilter<QueueF>> = lazyVal(() =>
  FunctorFilter.of({ ...queueFunctor(), mapFilter_: collect_ }),
);

export const queueApply: Lazy<Apply<QueueF>> = lazyVal(() => queueMonad());

export const queueApplicative: Lazy<Applicative<QueueF>> = lazyVal(() =>
  queueMonad(),
);

export const queueFlatMap: Lazy<FlatMap<QueueF>> = lazyVal(() => queueMonad());

export const queueCoflatMap: Lazy<CoflatMap<QueueF>> = lazyVal(() =>
  CoflatMap.of({ ...queueFunctor(), coflatMap_ }),
);

export const queueAlternative: Lazy<Alternative<QueueF>> = lazyVal(() =>
  Alternative.of({ ...queueMonad(), ...queueMonoidK() }),
);

export const queueMonad: Lazy<Monad<QueueF>> = lazyVal(() =>
  Monad.of({ pure, flatMap_, tailRecM_ }),
);

export const queueFoldable: Lazy<Foldable<QueueF>> = lazyVal(() =>
  Foldable.of({
    isEmpty,
    nonEmpty,
    size,
    all_,
    any_,
    count_,
    foldMap_,
    foldLeft_,
    foldRight_: <A, B>(
      xs: Queue<A>,
      eb: Eval<B>,
      f: (a: A, eb: Eval<B>) => Eval<B>,
    ): Eval<B> => {
      const loop = (xs: Queue<A>): Eval<B> =>
        dequeue(xs).fold(
          () => eb,
          ([hd, tl]) =>
            f(
              hd,
              Eval.defer(() => loop(tl)),
            ),
        );

      return loop(xs);
    },
    elem_: elemOption_,
    iterator,
  }),
);

export const queueTraversable: Lazy<Traversable<QueueF>> = lazyVal(() =>
  Traversable.of({ ...queueFoldable(), ...queueFunctor(), traverse_ }),
);
