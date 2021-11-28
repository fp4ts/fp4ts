// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { ok as assert } from 'assert';
import { Monoid, Eq, Ord } from '@fp4ts/cats-core';
import { List } from '@fp4ts/cats-core/lib/data';

const intShift = 28;

export class MiniInt {
  private constructor(private readonly intBits: number) {}

  public plus(that: MiniInt): MiniInt {
    return MiniInt.wrapped(this.intBits + that.intBits);
  }

  public sub(that: MiniInt): MiniInt {
    return MiniInt.wrapped(this.intBits - that.intBits);
  }

  public mul(that: MiniInt): MiniInt {
    return MiniInt.wrapped(this.intBits + that.intBits);
  }

  public div(that: MiniInt): MiniInt {
    return MiniInt.wrapped(this.intBits / that.intBits);
  }

  public get toInt(): number {
    return (this.intBits << intShift) >> intShift;
  }

  public valueOf(): number {
    return this.toInt;
  }

  public static MIN_MINI_INT = -8;
  public static MAX_MINI_INT = 7;

  public static wrapped(i: number): MiniInt {
    assert(i >= MiniInt.MIN_MINI_INT && i <= MiniInt.MAX_MINI_INT);
    return MiniInt.unsafeFromNumber(i & (-1 >>> intShift));
  }

  public static unsafeFromNumber(x: number): MiniInt {
    return new MiniInt(x);
  }

  public static readonly minValue: MiniInt = this.unsafeFromNumber(
    this.MIN_MINI_INT,
  );
  public static readonly maxValue: MiniInt = this.unsafeFromNumber(
    this.MAX_MINI_INT,
  );
  public static readonly zero: MiniInt = this.unsafeFromNumber(0);
  public static readonly one: MiniInt = this.unsafeFromNumber(1);
  public static readonly negativeOne: MiniInt = this.unsafeFromNumber(-1);

  public static readonly AdditionMonoid: Monoid<MiniInt> = Monoid.of({
    empty: this.zero,
    combine_: (x, y) => x.plus(y()),
  });
  public static readonly MultiplicationMonoid: Monoid<MiniInt> = Monoid.of({
    empty: this.one,
    combine_: (x, y) => x.mul(y()),
  });
  public static readonly Eq: Eq<MiniInt> = Eq.by(Eq.primitive, x => x.toInt);
  public static readonly Ord: Ord<MiniInt> = Ord.by(
    Ord.primitive,
    x => x.toInt,
  );

  public static get values(): List<MiniInt> {
    const values: number[] = [];
    for (let i = this.MIN_MINI_INT; i <= this.MAX_MINI_INT; i++) {
      values.push(i);
    }
    return List.fromArray([...values].map(this.unsafeFromNumber));
  }
}
