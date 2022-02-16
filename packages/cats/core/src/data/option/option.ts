// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $type, TyK, TyVar } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { EqK } from '../../eq-k';
import { SemigroupK } from '../../semigroup-k';
import { MonoidK } from '../../monoid-k';
import { Apply } from '../../apply';
import { Applicative } from '../../applicative';
import { Alternative } from '../../alternative';
import { Functor } from '../../functor';
import { FunctorFilter } from '../../functor-filter';
import { FlatMap } from '../../flat-map';
import { Monad } from '../../monad';
import { Foldable } from '../../foldable';
import { Traversable } from '../../traversable';

import { Either } from '../either';

import { Option as OptionBase } from './algebra';
import { fromEither, fromNullable, none, pure, some } from './constructors';
import {
  optionAlternative,
  optionApplicative,
  optionApply,
  optionEq,
  optionEqK,
  optionFlatMap,
  optionFoldable,
  optionFunctor,
  optionFunctorFilter,
  optionMonad,
  optionMonoidK,
  optionSemigroupK,
  optionTraversable,
} from './instances';
import { tailRecM } from './operators';

// -- Object

export type Option<A> = OptionBase<A>;

export const Option: OptionObj = function <A>(
  x: A | null | undefined,
): Option<A> {
  return fromNullable(x);
} as any;

export const Some = some;
export const None = none;

export const isOption = (x: unknown): x is Option<unknown> =>
  x instanceof OptionBase;

export interface OptionObj {
  <A>(x: A | null | undefined): Option<A>;
  pure: <A>(x: A) => Option<A>;
  some: <A>(x: A) => Option<A>;
  none: Option<never>;

  isOption: (x: unknown) => x is Option<unknown>;

  fromEither: <A>(ea: Either<unknown, A>) => Option<A>;
  fromNullable: <A>(x: A | null | undefined) => Option<A>;

  tailRecM: <A>(a: A) => <B>(f: (a: A) => Option<Either<A, B>>) => Option<B>;

  // -- Instances

  readonly EqK: EqK<OptionF>;
  readonly SemigroupK: SemigroupK<OptionF>;
  readonly MonoidK: MonoidK<OptionF>;
  readonly Functor: Functor<OptionF>;
  readonly FunctorFilter: FunctorFilter<OptionF>;
  readonly Apply: Apply<OptionF>;
  readonly Applicative: Applicative<OptionF>;
  readonly Alternative: Alternative<OptionF>;
  readonly FlatMap: FlatMap<OptionF>;
  readonly Monad: Monad<OptionF>;
  readonly Foldable: Foldable<OptionF>;
  readonly Traversable: Traversable<OptionF>;
  Eq<A>(E: Eq<A>): Eq<Option<A>>;
}

Option.pure = pure;
Option.some = some;
Option.none = none;
Option.isOption = isOption;
Option.fromEither = fromEither;
Option.fromNullable = fromNullable;
Option.tailRecM = tailRecM;

Object.defineProperty(Option, 'EqK', {
  get(): EqK<OptionF> {
    return optionEqK();
  },
});
Object.defineProperty(Option, 'SemigroupK', {
  get(): SemigroupK<OptionF> {
    return optionSemigroupK();
  },
});
Object.defineProperty(Option, 'MonoidK', {
  get(): MonoidK<OptionF> {
    return optionMonoidK();
  },
});
Object.defineProperty(Option, 'Functor', {
  get(): Functor<OptionF> {
    return optionFunctor();
  },
});
Object.defineProperty(Option, 'FunctorFilter', {
  get(): FunctorFilter<OptionF> {
    return optionFunctorFilter();
  },
});
Object.defineProperty(Option, 'Apply', {
  get(): Apply<OptionF> {
    return optionApply();
  },
});
Object.defineProperty(Option, 'Applicative', {
  get(): Applicative<OptionF> {
    return optionApplicative();
  },
});
Object.defineProperty(Option, 'Alternative', {
  get(): Alternative<OptionF> {
    return optionAlternative();
  },
});
Object.defineProperty(Option, 'FlatMap', {
  get(): FlatMap<OptionF> {
    return optionFlatMap();
  },
});
Object.defineProperty(Option, 'Monad', {
  get(): Monad<OptionF> {
    return optionMonad();
  },
});
Object.defineProperty(Option, 'Foldable', {
  get(): Foldable<OptionF> {
    return optionFoldable();
  },
});
Object.defineProperty(Option, 'Traversable', {
  get(): Traversable<OptionF> {
    return optionTraversable();
  },
});
Option.Eq = optionEq;

// -- HKT

/**
 * @category Type Constructor
 * @category Data
 */
export interface OptionF extends TyK<[unknown]> {
  [$type]: Option<TyVar<this, 0>>;
}
