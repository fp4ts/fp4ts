import { Apply } from '../../apply';
import { Applicative } from '../../applicative';
import { Alternative } from '../../alternative';
import { Foldable } from '../../foldable';
import { FlatMap } from '../../flat-map';
import { Functor } from '../../functor';
import { Monad } from '../../monad';
import { MonoidK } from '../../monoid-k';
import { SemigroupK } from '../../semigroup-k';
import { Traversable } from '../../traversable';

import { List as ListBase } from './algebra';
import { empty, fromArray, of, pure } from './constructors';
import {
  listApplicative,
  listApply,
  listFoldable,
  listFunctor,
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

  readonly SemigroupK: SemigroupK<URI>;
  readonly MonoidK: MonoidK<URI>;
  readonly Functor: Functor<URI>;
  readonly Apply: Apply<URI>;
  readonly Applicative: Applicative<URI>;
  readonly Alternative: Alternative<URI>;
  readonly FlatMap: FlatMap<URI>;
  readonly Monad: Monad<URI>;
  readonly Foldable: Foldable<URI>;
  readonly Traversable: Traversable<URI>;
}

List.pure = pure;
List.empty = empty;
List.of = of;
List.fromArray = fromArray;

Object.defineProperty(List, 'SemigroupK', {
  get(): SemigroupK<URI> {
    return listSemigroupK();
  },
});
Object.defineProperty(List, 'MonoidK', {
  get(): MonoidK<URI> {
    return listMonoidK();
  },
});
Object.defineProperty(List, 'Functor', {
  get(): Functor<URI> {
    return listFunctor();
  },
});
Object.defineProperty(List, 'Apply', {
  get(): Apply<URI> {
    return listApply();
  },
});
Object.defineProperty(List, 'Applicative', {
  get(): Applicative<URI> {
    return listApplicative();
  },
});
Object.defineProperty(List, 'Alternative', {
  get(): Alternative<URI> {
    return listAlternative();
  },
});
Object.defineProperty(List, 'FlatMap', {
  get(): FlatMap<URI> {
    return listFlatMap();
  },
});
Object.defineProperty(List, 'Monad', {
  get(): Monad<URI> {
    return listMonad();
  },
});
Object.defineProperty(List, 'Foldable', {
  get(): Foldable<URI> {
    return listFoldable();
  },
});
Object.defineProperty(List, 'Traversable', {
  get(): Traversable<URI> {
    return listTraversable();
  },
});

// HKT

export const URI = 'cats/data/list';
export type URI = typeof URI;

declare module '../../../fp/hkt' {
  interface URItoKind<A> {
    [URI]: List<A>;
  }
}
