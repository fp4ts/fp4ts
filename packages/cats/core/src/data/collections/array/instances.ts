import { lazyVal } from '@cats4ts/core';
import { Eq } from '../../../eq';
import { Eval } from '../../../eval';
import { Monoid } from '../../../monoid';
import { MonoidK } from '../../../monoid-k';
import { SemigroupK } from '../../../semigroup-k';
import { Align } from '../../../align';
import { Apply } from '../../../apply';
import { Applicative } from '../../../applicative';
import { Alternative } from '../../../alternative';
import { FlatMap } from '../../../flat-map';
import { Monad } from '../../../monad';
import { Foldable } from '../../../foldable';
import { Traversable } from '../../../traversable';
import { Functor } from '../../../functor';
import { FunctorFilter } from '../../../functor-filter';

import { ArrayK } from './array';
import {
  align_,
  all_,
  any_,
  collect_,
  concat_,
  count_,
  equals_,
  flatMap_,
  foldLeft_,
  foldMap_,
  isEmpty,
  map_,
  nonEmpty,
  sequence,
  size,
  tailRecM_,
  traverse_,
} from './operators';
import { empty, pure } from './constructors';

export const arrayEq = <A>(E: Eq<A>): Eq<A[]> => Eq.of({ equals: equals_(E) });

export const arraySemigroupK: () => SemigroupK<ArrayK> = lazyVal(() =>
  SemigroupK.of({ combineK_: (x, y) => concat_(x, y()) }),
);

export const arrayMonoidK: () => MonoidK<ArrayK> = lazyVal(() => {
  const { algebra, ...rest } = arraySemigroupK();
  return MonoidK.of({ ...rest, emptyK: () => empty });
});

export const arrayAlign: () => Align<ArrayK> = lazyVal(() =>
  Align.of({ functor: arrayFunctor(), align_: align_ }),
);

export const arrayFunctor: () => Functor<ArrayK> = lazyVal(() =>
  Functor.of({ map_ }),
);

export const arrayFunctorFilter: () => FunctorFilter<ArrayK> = lazyVal(() =>
  FunctorFilter.of({
    ...arrayFunctor(),
    mapFilter_: collect_,
  }),
);

export const arrayApply: () => Apply<ArrayK> = lazyVal(() =>
  Apply.of<ArrayK>({
    ...arrayFunctor(),
    ap_: (ff, fa) => flatMap_(ff, f => map_(fa, f)),
  }),
);

export const arrayApplicative: () => Applicative<ArrayK> = lazyVal(() =>
  Applicative.of({ ...arrayApply(), pure: pure, unit: [undefined] }),
);

export const arrayAlternative: () => Alternative<ArrayK> = lazyVal(() =>
  Alternative.of({ ...arrayApplicative(), ...arrayMonoidK() }),
);

export const arrayFlatMap: () => FlatMap<ArrayK> = lazyVal(() =>
  FlatMap.of({ ...arrayApply(), flatMap_: flatMap_, tailRecM_: tailRecM_ }),
);

export const arrayMonad: () => Monad<ArrayK> = lazyVal(() =>
  Monad.of({
    ...arrayApplicative(),
    ...arrayFlatMap(),
  }),
);

export const arrayFoldable: () => Foldable<ArrayK> = lazyVal(() =>
  Foldable.of({
    all_: all_,
    any_: any_,
    count_: count_,
    foldMap_:
      <M>(M: Monoid<M>) =>
      <A>(xs: A[], f: (a: A) => M) =>
        foldMap_(xs, f, M),
    foldLeft_: foldLeft_,
    foldRight_: <A, B>(
      xs: A[],
      eb: Eval<B>,
      f: (a: A, eb: Eval<B>) => Eval<B>,
    ): Eval<B> => {
      const loop = (i: number): Eval<B> =>
        i >= xs.length
          ? eb
          : f(
              xs[i],
              Eval.defer(() => loop(i + 1)),
            );
      return loop(0);
    },
    isEmpty: isEmpty,
    nonEmpty: nonEmpty,
    size: size,
  }),
);

export const arrayTraversable: () => Traversable<ArrayK> = lazyVal(() =>
  Traversable.of({
    ...arrayFunctor(),
    ...arrayFoldable(),
    traverse_: traverse_,
    sequence: sequence,
  }),
);
