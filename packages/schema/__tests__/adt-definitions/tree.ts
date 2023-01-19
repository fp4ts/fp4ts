// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $type, TyK, TyVar } from '@fp4ts/core';
import { SchemaK } from '@fp4ts/schema-kernel';
import fc, { Arbitrary } from 'fast-check';

export class Tree<A> {
  private readonly __void!: void;

  public static arb<A>(arbA: Arbitrary<A>): Arbitrary<Tree<A>> {
    const maxDepth = 20;
    const tip = fc.constant(Tip);
    const node = (n: number): Arbitrary<Tree<A>> =>
      n < 1
        ? tip
        : fc
            .tuple(arbA, tree(n - 1), tree(n - 1))
            .map(([v, lhs, rhs]) => new Bin(v, lhs as Tree<A>, rhs as Tree<A>));
    const tree = fc.memo((n: number) => fc.oneof(tip, node(n)));
    return tree(maxDepth);
  }

  public static readonly schemaK: SchemaK<TreeF> = SchemaK.sum('tag')({
    bin: SchemaK.struct({
      tag: SchemaK.literal('bin'),
      value: SchemaK.par,
      lhs: SchemaK.defer(() => Tree.schemaK),
      rhs: SchemaK.defer(() => Tree.schemaK),
    }),
    tip: SchemaK.struct({ tag: SchemaK.literal('tip') }),
  }).imap(
    t => (t.tag === 'bin' ? new Bin(t.value, t.lhs, t.rhs) : Tip),
    <A>(t: Tree<A>) => {
      const tt = t as Bin<A> | Tip;
      return tt.tag === 'bin'
        ? { tag: 'bin', value: tt.value, lhs: tt.lhs, rhs: tt.rhs }
        : { tag: 'tip' };
    },
  );
}

export class Bin<A> extends Tree<A> {
  public readonly tag = 'bin';
  public constructor(
    public readonly value: A,
    public readonly lhs: Tree<A>,
    public readonly rhs: Tree<A>,
  ) {
    super();
  }
}

export const Tip: Tree<never> & { tag: 'tip' } =
  new (class Tip extends Tree<never> {
    public readonly tag = 'tip';
  })();
export type Tip = typeof Tip;

export interface TreeF extends TyK<[unknown]> {
  [$type]: Tree<TyVar<this, 0>>;
}
