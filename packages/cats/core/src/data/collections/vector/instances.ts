import { Lazy } from '@cats4ts/core';
import { Eval } from '../../../eval';
import { Monoid } from '../../../monoid';
import { SemigroupK } from '../../../semigroup-k';
import { MonoidK } from '../../../monoid-k';
import { Functor } from '../../../functor';
import { FunctorFilter } from '../../../functor-filter';
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
  collect_,
  concat_,
  elem_,
  flatMap_,
  flatten,
  foldLeft_,
  map_,
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

export const vectorSemigroupK: Lazy<SemigroupK<VectorK>> = () =>
  SemigroupK.of({ combineK_: (x, y) => concat_(x, y()) });

export const vectorMonoidK: Lazy<MonoidK<VectorK>> = () =>
  MonoidK.of({ emptyK: () => empty, combineK_: (x, y) => concat_(x, y()) });

export const vectorFunctor: Lazy<Functor<VectorK>> = () =>
  Functor.of({ map_: map_ });

export const vectorFunctorFilter: Lazy<FunctorFilter<VectorK>> = () =>
  FunctorFilter.of({
    mapFilter_: collect_,
    collect_: collect_,
    ...vectorFunctor(),
  });

export const vectorApply: Lazy<Apply<VectorK>> = () =>
  Apply.of({
    ...vectorFunctor(),
    ap_: (ff, fa) => flatMap_(ff, f => map_(fa, a => f(a))),
  });

export const vectorApplicative: Lazy<Applicative<VectorK>> = () =>
  Applicative.of({
    ...vectorApply(),
    pure: pure,
  });

export const vectorAlternative: Lazy<Alternative<VectorK>> = () =>
  Alternative.of({
    ...vectorApplicative(),
    ...vectorMonoidK(),
  });

export const vectorFlatMap: Lazy<FlatMap<VectorK>> = () =>
  FlatMap.of({
    ...vectorApply(),
    map_: map_,
    flatMap_: flatMap_,
    flatten: flatten,
    tailRecM_: tailRecM_,
  });

export const vectorMonad: Lazy<Monad<VectorK>> = () =>
  Monad.of({
    ...vectorFlatMap(),
    ...vectorApplicative(),
  });

export const vectorFoldable: Lazy<Foldable<VectorK>> = () =>
  Foldable.of({
    size: size,
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
  });

export const vectorTraversable: Lazy<Traversable<VectorK>> = () =>
  Traversable.of({
    ...vectorFoldable(),
    ...vectorFunctor(),

    traverse_: traverse_,
  });
