// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { List, Either, Left, Right } from '@fp4ts/cats-core/lib/data';
import { MiniInt } from './mini-int';

export class ExhaustiveCheck<A> {
  public constructor(public readonly allValues: List<A>) {}

  public product<B>(that: ExhaustiveCheck<B>): ExhaustiveCheck<[A, B]> {
    return tuple2(this, that);
  }
}

export const miniInt = (): ExhaustiveCheck<MiniInt> =>
  new ExhaustiveCheck(MiniInt.values);

export const boolean = (): ExhaustiveCheck<boolean> =>
  new ExhaustiveCheck(List(false, true));

export const either = <A, B>(
  eca: ExhaustiveCheck<A>,
  ecb: ExhaustiveCheck<B>,
): ExhaustiveCheck<Either<A, B>> =>
  new ExhaustiveCheck(
    eca.allValues
      .map(a => Left<A, B>(a))
      ['++'](ecb.allValues.map(b => Right<B, A>(b))),
  );

export const instance = <A>(xs: List<A>): ExhaustiveCheck<A> =>
  new ExhaustiveCheck(xs);

export const tuple2 = <A, B>(
  a: ExhaustiveCheck<A>,
  b: ExhaustiveCheck<B>,
): ExhaustiveCheck<[A, B]> =>
  instance(a.allValues.flatMap(a => b.allValues.map(b => [a, b] as [A, B])));

export const tuple3 = <A, B, C>(
  a: ExhaustiveCheck<A>,
  b: ExhaustiveCheck<B>,
  c: ExhaustiveCheck<C>,
): ExhaustiveCheck<[A, B, C]> =>
  instance(
    a.allValues.flatMap(a =>
      b.allValues.flatMap(b => c.allValues.map(c => [a, b, c] as [A, B, C])),
    ),
  );
