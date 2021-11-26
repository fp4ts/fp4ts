import { Lazy, lazyVal } from '@fp4ts/core';
import { Align } from '../../../align';
import { Apply } from '../../../apply';
import { Applicative } from '../../../applicative';
import { Alternative } from '../../../alternative';
import { FlatMap } from '../../../flat-map';
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
import type { Queue, QueueK } from './queue';

export const queueSemigroupK: Lazy<SemigroupK<QueueK>> = lazyVal(() =>
  queueMonoidK(),
);

export const queueMonoidK: Lazy<MonoidK<QueueK>> = lazyVal(() =>
  MonoidK.of({ emptyK: () => empty, combineK_: (x, y) => concat_(x, y()) }),
);

export const queueAlign: Lazy<Align<QueueK>> = lazyVal(() =>
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

export const queueFunctor: Lazy<Functor<QueueK>> = lazyVal(() =>
  Functor.of({ map_ }),
);

export const queueFunctorFilter: Lazy<FunctorFilter<QueueK>> = lazyVal(() =>
  FunctorFilter.of({ ...queueFunctor(), mapFilter_: collect_ }),
);

export const queueApply: Lazy<Apply<QueueK>> = lazyVal(() => queueMonad());

export const queueApplicative: Lazy<Applicative<QueueK>> = lazyVal(() =>
  queueMonad(),
);

export const queueFlatMap: Lazy<FlatMap<QueueK>> = lazyVal(() => queueMonad());

export const queueAlternative: Lazy<Alternative<QueueK>> = lazyVal(() =>
  Alternative.of({ ...queueMonad(), ...queueMonoidK() }),
);

export const queueMonad: Lazy<Monad<QueueK>> = lazyVal(() =>
  Monad.of({ pure, flatMap_, tailRecM_ }),
);

export const queueFoldable: Lazy<Foldable<QueueK>> = lazyVal(() =>
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

export const queueTraversable: Lazy<Traversable<QueueK>> = lazyVal(() =>
  Traversable.of({ ...queueFoldable(), ...queueFunctor(), traverse_ }),
);
