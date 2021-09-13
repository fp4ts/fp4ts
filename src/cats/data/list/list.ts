import { URI } from '../../../core';

import { Apply } from '../../apply';
import { Applicative } from '../../applicative';
import { Alternative } from '../../alternative';
import { Foldable } from '../../foldable';
import { FlatMap } from '../../flat-map';
import { Functor } from '../../functor';
import { FunctorFilter } from '../../functor-filter';
import { Monad } from '../../monad';
import { MonoidK } from '../../monoid-k';
import { SemigroupK } from '../../semigroup-k';
import { Traversable } from '../../traversable';

import { List as ListBase } from './algebra';
import { empty, fromArray, of, pure } from './constructors';
import {
  Variance,
  listApplicative,
  listApply,
  listFoldable,
  listFunctor,
  listFunctorFilter,
  listMonoidK,
  listSemigroupK,
  listTraversable,
  listFlatMap,
  listMonad,
  listAlternative,
} from './instances';

export type List<A> = ListBase<A>;

export const List: ListObj = function <A>(...xs: A[]): List<A> {
  return fromArray(xs);
} as any;

interface ListObj {
  <A>(...xs: A[]): List<A>;

  pure: <A>(x: A) => List<A>;
  empty: List<never>;
  of: <A>(...xs: A[]) => List<A>;
  fromArray: <A>(xs: A[]) => List<A>;

  // -- Instances

  readonly SemigroupK: SemigroupK<[URI<ListURI, Variance>], Variance>;
  readonly MonoidK: MonoidK<[URI<ListURI, Variance>], Variance>;
  readonly Functor: Functor<[URI<ListURI, Variance>], Variance>;
  readonly FunctorFilter: FunctorFilter<[URI<ListURI, Variance>], Variance>;
  readonly Apply: Apply<[URI<ListURI, Variance>], Variance>;
  readonly Applicative: Applicative<[URI<ListURI, Variance>], Variance>;
  readonly Alternative: Alternative<[URI<ListURI, Variance>], Variance>;
  readonly FlatMap: FlatMap<[URI<ListURI, Variance>], Variance>;
  readonly Monad: Monad<[URI<ListURI, Variance>], Variance>;
  readonly Foldable: Foldable<[URI<ListURI, Variance>], Variance>;
  readonly Traversable: Traversable<[URI<ListURI, Variance>], Variance>;
}

List.pure = pure;
List.empty = empty;
List.of = of;
List.fromArray = fromArray;

Object.defineProperty(List, 'SemigroupK', {
  get(): SemigroupK<[URI<ListURI, Variance>], Variance> {
    return listSemigroupK();
  },
});
Object.defineProperty(List, 'MonoidK', {
  get(): MonoidK<[URI<ListURI, Variance>], Variance> {
    return listMonoidK();
  },
});
Object.defineProperty(List, 'Functor', {
  get(): Functor<[URI<ListURI, Variance>], Variance> {
    return listFunctor();
  },
});
Object.defineProperty(List, 'FunctorFilter', {
  get(): FunctorFilter<[URI<ListURI, Variance>], Variance> {
    return listFunctorFilter();
  },
});
Object.defineProperty(List, 'Apply', {
  get(): Apply<[URI<ListURI, Variance>], Variance> {
    return listApply();
  },
});
Object.defineProperty(List, 'Applicative', {
  get(): Applicative<[URI<ListURI, Variance>], Variance> {
    return listApplicative();
  },
});
Object.defineProperty(List, 'Alternative', {
  get(): Alternative<[URI<ListURI, Variance>], Variance> {
    return listAlternative();
  },
});
Object.defineProperty(List, 'FlatMap', {
  get(): FlatMap<[URI<ListURI, Variance>], Variance> {
    return listFlatMap();
  },
});
Object.defineProperty(List, 'Monad', {
  get(): Monad<[URI<ListURI, Variance>], Variance> {
    return listMonad();
  },
});
Object.defineProperty(List, 'Foldable', {
  get(): Foldable<[URI<ListURI, Variance>], Variance> {
    return listFoldable();
  },
});
Object.defineProperty(List, 'Traversable', {
  get(): Traversable<[URI<ListURI, Variance>], Variance> {
    return listTraversable();
  },
});

// HKT

export const ListURI = 'cats/data/list';
export type ListURI = typeof ListURI;

declare module '../../../core/hkt/hkt' {
  interface URItoKind<FC, TC, S, R, E, A> {
    [ListURI]: List<A>;
  }
}
