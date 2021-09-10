import { URI } from '../../../core';
import { MonoidK } from '../../monoid-k';
import { SemigroupK } from '../../semigroup-k';
import { Alternative } from '../../alternative';
import { Applicative } from '../../applicative';
import { Apply } from '../../apply';
import { FlatMap } from '../../flat-map';
import { Functor } from '../../functor';
import { Monad } from '../../monad';

import { Either } from '../either';
import { Option as OptionBase } from './algebra';
import { fromEither, fromNullable, none, pure, some } from './constructors';
import {
  optionAlternative,
  optionApplicative,
  optionApply,
  optionFlatMap,
  optionFunctor,
  optionMonad,
  optionMonoidK,
  optionSemigroupK,
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
  pure: <A>(x: A) => Option<A>;
  some: <A>(x: A) => Option<A>;
  none: Option<never>;
  fromEither: <A>(ea: Either<unknown, A>) => Option<A>;
  fromNullable: <A>(x: A | null | undefined) => Option<A>;

  // -- Instances

  readonly SemigroupK: SemigroupK<[URI<OptionURI>]>;
  readonly MonoidK: MonoidK<[URI<OptionURI>]>;
  readonly Functor: Functor<[URI<OptionURI>]>;
  readonly Apply: Apply<[URI<OptionURI>]>;
  readonly Applicative: Applicative<[URI<OptionURI>]>;
  readonly Alternative: Alternative<[URI<OptionURI>]>;
  readonly FlatMap: FlatMap<[URI<OptionURI>]>;
  readonly Monad: Monad<[URI<OptionURI>]>;
}

Option.pure = pure;
Option.some = some;
Option.none = none;
Option.fromEither = fromEither;
Option.fromNullable = fromNullable;

Object.defineProperty(Option, 'SemigroupK', {
  get(): SemigroupK<[URI<OptionURI>]> {
    return optionSemigroupK();
  },
});
Object.defineProperty(Option, 'MonoidK', {
  get(): MonoidK<[URI<OptionURI>]> {
    return optionMonoidK();
  },
});
Object.defineProperty(Option, 'Functor', {
  get(): Functor<[URI<OptionURI>]> {
    return optionFunctor();
  },
});
Object.defineProperty(Option, 'Apply', {
  get(): Apply<[URI<OptionURI>]> {
    return optionApply();
  },
});
Object.defineProperty(Option, 'Applicative', {
  get(): Applicative<[URI<OptionURI>]> {
    return optionApplicative();
  },
});
Object.defineProperty(Option, 'Alternative', {
  get(): Alternative<[URI<OptionURI>]> {
    return optionAlternative();
  },
});
Object.defineProperty(Option, 'FlatMap', {
  get(): FlatMap<[URI<OptionURI>]> {
    return optionFlatMap();
  },
});
Object.defineProperty(Option, 'Monad', {
  get(): Monad<[URI<OptionURI>]> {
    return optionMonad();
  },
});

// -- HKT

export const OptionURI = 'cats/data/option';
export type OptionURI = typeof OptionURI;

declare module '../../../core/hkt/hkt' {
  interface URItoKind<FC, S, R, E, A> {
    [OptionURI]: Option<A>;
  }
}
