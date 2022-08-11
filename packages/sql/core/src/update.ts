// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Foldable } from '@fp4ts/cats';
import { Kind } from '@fp4ts/core';
import { ConnectionIO, Fragment, PreparedStatement } from './free';

export class Write<in A> {
  public static readonly unit: Write<void> = new Write(() => []);

  public constructor(public readonly toRow: (a: A) => unknown[]) {}

  public contramap<A0>(f: (a0: A0) => A): Write<A0> {
    return new Write(a0 => this.toRow(f(a0)));
  }
}

export class Update<in A> {
  public constructor(
    public readonly W: Write<A>,
    public readonly fragment: Fragment,
  ) {}

  public run(a: A): ConnectionIO<number> {
    return this.prepareStatement(ps =>
      ps
        .set(this.W)(a)
        .flatMap(ps => ps.query())
        .flatMap(rs => rs.getRowCount()),
    );
  }

  public updateMany<F>(
    F: Foldable<F>,
  ): (fa: Kind<F, [A]>) => ConnectionIO<number> {
    return fa =>
      this.prepareStatement(ps =>
        F.toList(fa).foldRight(ConnectionIO.pure(0), (a, fi) =>
          ps
            .set(this.W)(a)
            .flatMap(ps => ps.query())
            .flatMap(rs => rs.getRowCount())
            .map2(fi)((a, b) => a + b),
        ),
      );
  }

  private prepareStatement<R>(
    f: (ps: PreparedStatement) => ConnectionIO<R>,
  ): ConnectionIO<R> {
    return ConnectionIO.prepareStatement(this.fragment).bracket(
      ps => f(ps),
      ps => ps.close(),
    );
  }
}

export class Update0 extends Update<void> {
  public constructor(fragment: Fragment) {
    super(Write.unit, fragment);
  }
}
