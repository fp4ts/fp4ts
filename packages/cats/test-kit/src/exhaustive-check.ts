// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { lazy } from '@fp4ts/core';
import { Either, Left, Right } from '@fp4ts/cats-core/lib/data';
import { MiniInt } from './mini-int';

export type ExhaustiveCheck<A> = _ExhaustiveCheck<A>;
export function ExhaustiveCheck<A>(...xs: A[]): ExhaustiveCheck<A> {
  return ExhaustiveCheck.fromArray(xs);
}

class _ExhaustiveCheck<out A> {
  public constructor(public readonly allValues: A[]) {}

  public concat<A>(
    this: ExhaustiveCheck<A>,
    that: ExhaustiveCheck<A>,
  ): ExhaustiveCheck<A> {
    return new _ExhaustiveCheck(this.allValues.concat(that.allValues));
  }

  public map<B>(f: (a: A) => B): ExhaustiveCheck<B> {
    return new _ExhaustiveCheck(this.allValues.map(x => f(x)));
  }

  public flatMap<B>(f: (a: A) => ExhaustiveCheck<B>): ExhaustiveCheck<B> {
    return new _ExhaustiveCheck(this.allValues.flatMap(x => f(x).allValues));
  }

  public product<B>(that: ExhaustiveCheck<B>): ExhaustiveCheck<[A, B]> {
    return this.flatMap(a => that.map(b => [a, b] as [A, B]));
  }
}

ExhaustiveCheck.fromArray = <A>(xs: A[]): ExhaustiveCheck<A> =>
  new _ExhaustiveCheck(xs);

ExhaustiveCheck.miniInt = lazy(
  (): ExhaustiveCheck<MiniInt> => new _ExhaustiveCheck(MiniInt.values),
);

ExhaustiveCheck.boolean = lazy(
  (): ExhaustiveCheck<boolean> => new _ExhaustiveCheck([false, true]),
);

ExhaustiveCheck.either = <A, B>(
  eca: ExhaustiveCheck<A>,
  ecb: ExhaustiveCheck<B>,
): ExhaustiveCheck<Either<A, B>> =>
  eca.map(Left<A, B>).concat(ecb.map(Right<B, A>));

ExhaustiveCheck.tuple3 = <A, B, C>(
  a: ExhaustiveCheck<A>,
  b: ExhaustiveCheck<B>,
  c: ExhaustiveCheck<C>,
): ExhaustiveCheck<[A, B, C]> =>
  new _ExhaustiveCheck(
    a.allValues.flatMap(a =>
      b.allValues.flatMap(b => c.allValues.map(c => [a, b, c] as [A, B, C])),
    ),
  );
