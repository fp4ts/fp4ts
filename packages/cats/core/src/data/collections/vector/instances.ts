import { id, Lazy, lazyVal } from '@cats4ts/core';
import { Eq } from '../../../eq';
import { Eval } from '../../../eval';
import { Monoid } from '../../../monoid';
import { SemigroupK } from '../../../semigroup-k';
import { MonoidK } from '../../../monoid-k';
import { Functor } from '../../../functor';
import { FunctorFilter } from '../../../functor-filter';
import { Align } from '../../../align';
import { Apply } from '../../../apply';
import { Applicative } from '../../../applicative';
import { Alternative } from '../../../alternative';
import { FlatMap } from '../../../flat-map';
import { Monad } from '../../../monad';
import { Foldable } from '../../../foldable';
import { Traversable } from '../../../traversable';

import { FingerTree } from '../finger-tree';
import { fingerTreeMeasured } from '../finger-tree/instances';
import { Measured } from '../finger-tree/measured';

import { Size } from './algebra';
import {
  align_,
  all_,
  any_,
  collect_,
  concat_,
  count_,
  elemOption_,
  elem_,
  equals_,
  flatMap_,
  flatten,
  foldLeft_,
  isEmpty,
  iterator,
  map_,
  nonEmpty,
  size,
  tailRecM_,
  traverse_,
} from './operators';
import { Vector, VectorK } from './vector';
import { empty, pure } from './constructors';

export const sizeMonoid: Monoid<Size> = {
  empty: 0,
  combine: y => x => x + y(),
  combine_: (x, y) => x + y(),
};

export const sizeMeasured: Measured<any, Size> = {
  monoid: sizeMonoid,
  measure: () => 1,
};

export const fingerTreeSizeMeasured: Measured<
  FingerTree<Size, any>,
  Size
> = fingerTreeMeasured(sizeMeasured);

export const vectorEq: <A>(E: Eq<A>) => Eq<Vector<A>> = E =>
  Eq.of({ equals: equals_(E) });

export const vectorSemigroupK: Lazy<SemigroupK<VectorK>> = lazyVal(() =>
  SemigroupK.of({ combineK_: (x, y) => concat_(x, y()) }),
);

export const vectorMonoidK: Lazy<MonoidK<VectorK>> = lazyVal(() =>
  MonoidK.of({ emptyK: () => empty, combineK_: (x, y) => concat_(x, y()) }),
);

export const vectorFunctor: Lazy<Functor<VectorK>> = lazyVal(() =>
  Functor.of({ map_: map_ }),
);

export const vectorAlign: Lazy<Align<VectorK>> = lazyVal(() =>
  Align.of({ align_: align_, functor: vectorFunctor() }),
);

export const vectorFunctorFilter: Lazy<FunctorFilter<VectorK>> = lazyVal(() =>
  FunctorFilter.of({
    mapFilter_: collect_,
    collect_: collect_,
    ...vectorFunctor(),
  }),
);

export const vectorApply: Lazy<Apply<VectorK>> = lazyVal(() =>
  Apply.of({
    ...vectorFunctor(),
    ap_: (ff, fa) => flatMap_(ff, f => map_(fa, a => f(a))),
  }),
);

export const vectorApplicative: Lazy<Applicative<VectorK>> = lazyVal(() =>
  Applicative.of({
    ...vectorApply(),
    pure: pure,
  }),
);

export const vectorAlternative: Lazy<Alternative<VectorK>> = lazyVal(() =>
  Alternative.of({
    ...vectorApplicative(),
    ...vectorMonoidK(),
  }),
);

export const vectorFlatMap: Lazy<FlatMap<VectorK>> = lazyVal(() =>
  FlatMap.of({
    ...vectorApply(),
    map_: map_,
    flatMap_: flatMap_,
    flatten: flatten,
    tailRecM_: tailRecM_,
  }),
);

export const vectorMonad: Lazy<Monad<VectorK>> = lazyVal(() =>
  Monad.of({
    ...vectorFlatMap(),
    ...vectorApplicative(),
  }),
);

export const vectorFoldable: Lazy<Foldable<VectorK>> = lazyVal(() =>
  Foldable.of({
    isEmpty: isEmpty,
    nonEmpty: nonEmpty,
    size: size,
    all_: all_,
    any_: any_,
    count_: count_,
    foldLeft_: foldLeft_,
    foldRight_: <A, B>(
      xs: Vector<A>,
      eb: Eval<B>,
      f: (a: A, b: Eval<B>) => Eval<B>,
    ): Eval<B> => {
      const loop = (i: number): Eval<B> =>
        i < size(xs)
          ? f(
              elem_(xs, i),
              Eval.defer(() => loop(i + 1)),
            )
          : eb;
      return loop(0);
    },
    elem_: elemOption_,
    iterator: iterator,
    toVector: id,
  }),
);

export const vectorTraversable: Lazy<Traversable<VectorK>> = lazyVal(() =>
  Traversable.of({
    ...vectorFoldable(),
    ...vectorFunctor(),

    traverse_: traverse_,
  }),
);
