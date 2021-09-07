import { Applicative } from '../../applicative';
import { Apply } from '../../apply';
import { FlatMap } from '../../flat-map';
import { Functor } from '../../functor';
import { Monad } from '../../monad';

import { Either } from '../either';
import { Option as OptionBase } from './algebra';
import { fromEither, fromNullable, none, some } from './constructors';
import {
  optionApplicative,
  optionApply,
  optionFlatMap,
  optionFunctor,
  optionMonad,
} from './instances';

// -- Object

export type Option<A> = OptionBase<A>;

export const Option: OptionObj = function <A>(
  x: A | null | undefined,
): Option<A> {
  return fromNullable(x);
} as any;

export const Some = some;
export const None = none;

export interface OptionObj {
  <A>(x: A | null | undefined): Option<A>;
  some: <A>(x: A) => Option<A>;
  none: Option<never>;
  fromEither: <A>(ea: Either<unknown, A>) => Option<A>;
  fromNullable: <A>(x: A | null | undefined) => Option<A>;

  // -- Instances

  readonly Functor: Functor<URI>;
  readonly Apply: Apply<URI>;
  readonly Applicative: Applicative<URI>;
  readonly FlatMap: FlatMap<URI>;
  readonly Monad: Monad<URI>;
}

Option.some = some;
Option.none = none;
Option.fromEither = fromEither;
Option.fromNullable = fromNullable;

Object.defineProperty(Option, 'Functor', {
  get(): Functor<URI> {
    return optionFunctor();
  },
});
Object.defineProperty(Option, 'Apply', {
  get(): Apply<URI> {
    return optionApply();
  },
});
Object.defineProperty(Option, 'Applicative', {
  get(): Applicative<URI> {
    return optionApplicative();
  },
});
Object.defineProperty(Option, 'FlatMap', {
  get(): FlatMap<URI> {
    return optionFlatMap();
  },
});
Object.defineProperty(Option, 'Monad', {
  get(): Monad<URI> {
    return optionMonad();
  },
});

// -- HKT

export const URI = 'cats/data/option';
export type URI = typeof URI;

declare module '../../../fp/hkt' {
  interface URItoKind<A> {
    [URI]: Option<A>;
  }
}
