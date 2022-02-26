// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Lazy, lazyVal } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Align } from '../../../align';
import { Alternative } from '../../../alternative';
import { Applicative } from '../../../applicative';
import { Functor } from '../../../functor';
import { FunctorFilter } from '../../../functor-filter';
import { CoflatMap } from '../../../coflat-map';
import { Monad } from '../../../monad';
import { Foldable } from '../../../foldable';
import { Traversable } from '../../../traversable';
import { MonoidK } from '../../../monoid-k';
import { Eval } from '../../../eval';

import { Vector } from './algebra';
import {
  align_,
  all_,
  any_,
  coflatMap_,
  collect_,
  count_,
  equals_,
  flatMap_,
  foldLeft_,
  isEmpty,
  nonEmpty,
  traverse_,
  zipAll_,
} from './operators';

import type { VectorF } from './vector';
import { pure, tailRecM_ } from './constructors';

export const vectorEq: <A>(E: Eq<A>) => Eq<Vector<A>> = E =>
  Eq.of({ equals: equals_(E) });

export const vectorMonoidK: Lazy<MonoidK<VectorF>> = lazyVal(() =>
  MonoidK.of({
    emptyK: () => Vector.empty,
    combineK_: (x, y) => x.concat(y()),
  }),
);

export const vectorAlign: Lazy<Align<VectorF>> = lazyVal(() =>
  Align.of({
    functor: vectorFunctor(),
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

export const vectorFunctor: Lazy<Functor<VectorF>> = lazyVal(() =>
  Functor.of({ map_: (xs, f) => xs.map(f) }),
);
export const vectorFunctorFilter: Lazy<FunctorFilter<VectorF>> = lazyVal(() =>
  FunctorFilter.of({
    ...vectorFunctor(),
    mapFilter_: collect_,
    collect_: collect_,
  }),
);

export const vectorApplicative: Lazy<Applicative<VectorF>> = lazyVal(() =>
  vectorMonad(),
);

export const vectorAlternative: Lazy<Alternative<VectorF>> = lazyVal(() =>
  Alternative.of({ ...vectorMonoidK(), ...vectorApplicative() }),
);

export const vectorCoflatMap: Lazy<CoflatMap<VectorF>> = lazyVal(() =>
  CoflatMap.of({ ...vectorFunctor(), coflatMap_ }),
);

export const vectorMonad: Lazy<Monad<VectorF>> = lazyVal(() =>
  Monad.of({
    ...vectorFunctor(),
    pure: pure,
    flatMap_: flatMap_,
    tailRecM_: tailRecM_,
  }),
);

export const vectorFoldable: Lazy<Foldable<VectorF>> = lazyVal(() =>
  Foldable.of({
    all_: all_,
    any_: any_,
    count_: count_,
    elem_: (xs, idx) => xs.elemOption(idx),
    foldLeft_: foldLeft_,
    foldRight_: <A, B>(
      xs: Vector<A>,
      ez: Eval<B>,
      f: (a: A, eb: Eval<B>) => Eval<B>,
    ): Eval<B> => {
      const loop = (i: number): Eval<B> =>
        i >= xs.size
          ? ez
          : f(
              xs.elem(i),
              Eval.defer(() => loop(i + 1)),
            );
      return loop(0);
    },
    isEmpty: isEmpty,
    nonEmpty: nonEmpty,
    size: xs => xs.size,
  }),
);

export const vectorTraversable: Lazy<Traversable<VectorF>> = lazyVal(() =>
  Traversable.of({
    ...vectorFoldable(),
    ...vectorFunctor(),
    traverse_: traverse_,
  }),
);
