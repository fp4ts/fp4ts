// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Either, Left, Option, Right } from '@fp4ts/cats';
import { Prism, getOrModify } from './profunctor';

export function match<T>(t: T): Matcher<T, never> {
  return new Matcher(Left(t));
}

export function case_<T, B>(p: Prism<T, B>): Matcher_<T, B>;
export function case_<T, B, C>(p: Prism<T, B>, f: (b: B) => C): Matcher_<T, C>;
export function case_<T, B, C>(
  p: Prism<T, B>,
  f?: (b: B) => C,
): Matcher_<T, B | C> {
  return <A>(ea: Either<T, A>) =>
    ea.fold(
      value => (f ? getOrModify(p)(value).map(f) : getOrModify(p)(value)),
      Right,
    );
}

type Matcher_<T, B> = <A>(ea: Either<T, A>) => Either<T, A | B>;

class Matcher<T, A> {
  public constructor(private readonly value: Either<T, A>) {}

  public case<B>(p: Prism<T, B>): Matcher<T, A | B>;
  public case<B, C>(p: Prism<T, B>, f: (b: B) => C): Matcher<T, A | C>;
  public case<B, C>(p: Prism<T, B>, f?: (b: B) => C): Matcher<T, A | B | C> {
    return new Matcher(case_(p, f!)(this.value));
  }

  public get(): A {
    return this.value.get;
  }

  public getOption(): Option<A> {
    return this.value.toOption;
  }

  public getEither(): Either<T, A> {
    return this.value;
  }

  public getOrElse<B>(defaultValue: () => B): A | B {
    return this.value.getOrElse<A | B>(defaultValue);
  }
}
