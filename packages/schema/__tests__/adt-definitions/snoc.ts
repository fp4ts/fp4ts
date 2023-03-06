// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Arbitrary } from 'fast-check';
import { $type, TyK, TyVar } from '@fp4ts/core';
import { List } from '@fp4ts/collections';
import { SchemaK } from '@fp4ts/schema-kernel';
import * as A from '@fp4ts/collections-test-kit/lib/arbitraries';

export abstract class Snoc<A> {
  private readonly __void!: void;

  public abstract fold<B, C = B>(
    onNil: () => B,
    onCons: (init: Snoc<A>, last: A) => C,
  ): B | C;

  public static fromList<A>(xs: List<A>): Snoc<A> {
    return xs.foldLeft(SNil as Snoc<A>, (xs, x) => new SCons(xs, x));
  }

  public static toList<A>(xs: Snoc<A>): List<A> {
    let acc: List<A> = List.empty;
    while (xs !== SNil) {
      const ys = xs as SCons<A>;
      acc = acc.prepend(ys.last);
      xs = ys.init;
    }
    return acc;
  }

  public static arb<A>(arbA: Arbitrary<A>): Arbitrary<Snoc<A>> {
    return A.fp4tsList(arbA).map(Snoc.fromList);
  }

  public static schemaK: SchemaK<SnocF> = SchemaK.sum('tag')({
    cons: SchemaK.struct({
      tag: SchemaK.literal('cons'),
      init: SchemaK.defer(() => Snoc.schemaK),
      last: SchemaK.par,
    }),
    nil: SchemaK.struct({ tag: SchemaK.literal('nil') }),
  }).imap(
    xs => (xs.tag === 'cons' ? new SCons(xs.init, xs.last) : SNil),
    <A>(xs: Snoc<A>) =>
      xs.fold(
        () => ({ tag: 'nil' }),
        (init, last) => ({ tag: 'cons', init, last }),
      ),
  );
}

export class SCons<A> extends Snoc<A> {
  public readonly tag = 'cons';

  public constructor(public readonly init: Snoc<A>, public readonly last: A) {
    super();
  }

  public fold<B, C = B>(
    onNil: () => B,
    onCons: (init: Snoc<A>, last: A) => C,
  ): B | C {
    return onCons(this.init, this.last);
  }
}

export const SNil: Snoc<never> & { tag: 'nil' } =
  new (class SNil extends Snoc<never> {
    public readonly tag = 'nil';

    public fold<B, C = B>(
      onNil: () => B,
      onCons: (init: Snoc<never>, last: never) => C,
    ): B | C {
      return onNil();
    }
  })();

export interface SnocF extends TyK<[unknown]> {
  [$type]: Snoc<TyVar<this, 0>>;
}
