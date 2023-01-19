// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eval, Kind, Lazy, lazyVal } from '@fp4ts/core';
import { Eq, Monoid } from '@fp4ts/cats-kernel';
import { EqK } from '../../../eq-k';
import { MonoidK } from '../../../monoid-k';
import { SemigroupK } from '../../../semigroup-k';
import { Align } from '../../../align';
import { Apply } from '../../../apply';
import { Applicative } from '../../../applicative';
import { Alternative } from '../../../alternative';
import { FlatMap } from '../../../flat-map';
import { CoflatMap } from '../../../coflat-map';
import { Monad } from '../../../monad';
import { Functor } from '../../../functor';
import { FunctorFilter } from '../../../functor-filter';
import { FunctorWithIndex } from '../../../functor-with-index';
import { FoldableWithIndex } from '../../../foldable-with-index';
import { TraversableWithIndex } from '../../../traversable-with-index';
import { TraversableFilter } from '../../../traversable-filter';

import { ArrayF } from './array';
import {
  align_,
  all_,
  any_,
  coflatMap_,
  collect_,
  concat_,
  count_,
  elem_,
  equals_,
  flatMap_,
  foldLeft_,
  foldMapK_,
  foldMap_,
  foldRightEval_,
  isEmpty,
  map_,
  nonEmpty,
  sequence,
  size,
  tailRecM_,
  traverseFilter_,
  traverse_,
} from './operators';
import { empty, pure } from './constructors';
import { List } from '../list';

export const arrayEq = <A>(E: Eq<A>): Eq<A[]> => Eq.of({ equals: equals_(E) });

export const arrayEqK: Lazy<EqK<ArrayF>> = lazyVal(() =>
  EqK.of({ liftEq: arrayEq }),
);

export const arraySemigroupK: () => SemigroupK<ArrayF> = lazyVal(() =>
  SemigroupK.of({
    combineK_: (x, y) => concat_(x, y),
    combineKEval_: (xs, eys) =>
      xs.length === 0 ? eys : eys.map(ys => concat_(xs, ys)),
  }),
);

export const arrayMonoidK: () => MonoidK<ArrayF> = lazyVal(() => {
  return MonoidK.of({
    combineK_: (x, y) => concat_(x, y),
    combineKEval_: (xs, eys) =>
      xs.length === 0 ? eys : eys.map(ys => concat_(xs, ys)),
    emptyK: () => empty,
  });
});

export const arrayAlign: () => Align<ArrayF> = lazyVal(() =>
  Align.of({ functor: arrayFunctor(), align_: align_ }),
);

export const arrayFunctorWithIndex: () => FunctorWithIndex<ArrayF, number> =
  lazyVal(() => FunctorWithIndex.of({ mapWithIndex_: map_ }));

export const arrayFunctor: () => Functor<ArrayF> = arrayFunctorWithIndex;

export const arrayFunctorFilter: () => FunctorFilter<ArrayF> = lazyVal(() =>
  FunctorFilter.of({
    ...arrayFunctor(),
    mapFilter_: collect_,
  }),
);

export const arrayApply: () => Apply<ArrayF> = lazyVal(() =>
  Apply.of<ArrayF>({
    ...arrayFunctor(),
    ap_: (ff, fa) => flatMap_(ff, f => map_(fa, x => f(x))),
    map2Eval_:
      <A, B>(fa: A[], fb: Eval<B[]>) =>
      <C>(f: (a: A, b: B) => C) =>
        fa.length === 0
          ? Eval.now([])
          : fb.map(fb => fa.flatMap(a => fb.map(b => f(a, b)))),
  }),
);

export const arrayApplicative: () => Applicative<ArrayF> = lazyVal(() =>
  Applicative.of({ ...arrayApply(), pure: pure, unit: [undefined] }),
);

export const arrayAlternative: () => Alternative<ArrayF> = lazyVal(() =>
  Alternative.of({ ...arrayApplicative(), ...arrayMonoidK() }),
);

export const arrayFlatMap: () => FlatMap<ArrayF> = lazyVal(() =>
  FlatMap.of({ ...arrayApply(), flatMap_: flatMap_, tailRecM_: tailRecM_ }),
);

export const arrayCoflatMap: () => CoflatMap<ArrayF> = lazyVal(() =>
  CoflatMap.of({ ...arrayFunctor(), coflatMap_ }),
);

export const arrayMonad: () => Monad<ArrayF> = lazyVal(() =>
  Monad.of({
    ...arrayApplicative(),
    ...arrayFlatMap(),
  }),
);

export const arrayFoldableWithIndex: () => FoldableWithIndex<ArrayF, number> =
  lazyVal(() =>
    FoldableWithIndex.of({
      all_: all_,
      any_: any_,
      count_: count_,
      elem_: elem_,
      foldMapWithIndex_:
        <M>(M: Monoid<M>) =>
        <A>(xs: A[], f: (a: A, i: number) => M) =>
          foldMap_(xs, f, M),
      foldMapKWithIndex_:
        <F>(F: MonoidK<F>) =>
        <A, B>(xs: A[], f: (a: A, i: number) => Kind<F, [B]>) =>
          foldMapK_(xs, f, F),
      iterator: fa => fa[Symbol.iterator](),
      foldLeft_: (fa, b, f) => foldLeft_(fa, b, (b, a) => f(b, a)),
      foldLeftWithIndex_: foldLeft_,
      foldRightWithIndex_: foldRightEval_,
      toList: xs => List.fromArray(xs),
      isEmpty: isEmpty,
      nonEmpty: nonEmpty,
      size: size,
    }),
  );

export const arrayTraversableWithIndex: () => TraversableWithIndex<
  ArrayF,
  number
> = lazyVal(() =>
  TraversableWithIndex.of({
    ...arrayFunctorWithIndex(),
    ...arrayFoldableWithIndex(),
    traverseWithIndex_: traverse_,
    sequence: sequence,
  }),
);

export const arrayTraversableFilter: () => TraversableFilter<ArrayF> = lazyVal(
  () =>
    TraversableFilter.of({
      ...arrayTraversableWithIndex(),
      ...arrayFunctorFilter(),
      traverseFilter_,
    }),
);
