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
import { MonoidK } from '../../../monoid-k';

import { Vector, Vector0 } from './algebra';
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
  foldMap_,
  foldRight_,
  isEmpty,
  nonEmpty,
  traverseFilter_,
  traverse_,
  zipAll_,
} from './operators';

import type { VectorF } from './vector';
import { pure, tailRecM_ } from './constructors';
import { Eval } from '../../../eval';
import { TraversableFilter } from '../../../traversable-filter';

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
    map_: (fa, f) => fa.map(f),
    flatMap_: flatMap_,
    tailRecM_: tailRecM_,
    map2Eval_:
      <A, B>(fa: Vector<A>, efb: Eval<Vector<B>>) =>
      <C>(f: (a: A, b: B) => C) =>
        fa === Vector0
          ? Eval.now(Vector0)
          : efb.map(fb => flatMap_(fa, a => fb.map(b => f(a, b)))),
  }),
);

export const vectorFoldable: Lazy<Foldable<VectorF>> = lazyVal(() =>
  Foldable.of({
    all_: all_,
    any_: any_,
    count_: count_,
    elem_: (xs, idx) => xs.elemOption(idx),
    foldLeft_: foldLeft_,
    foldRight_: foldRight_,
    foldMap_: foldMap_,
    isEmpty: isEmpty,
    nonEmpty: nonEmpty,
    size: xs => xs.size,
  }),
);

export const vectorTraversableFilter: Lazy<TraversableFilter<VectorF>> =
  lazyVal(() =>
    TraversableFilter.of({
      ...vectorFoldable(),
      ...vectorFunctorFilter(),
      traverse_: traverse_,
      traverseFilter_: traverseFilter_,
    }),
  );
