// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/ban-types */
import { $, $type, TyK, TyVar } from '@fp4ts/core';
import { ConstK, Option, Some, None } from '@fp4ts/cats';
import { SchemaK, SchemableK } from '@fp4ts/schema-kernel';

describe('schemable-k', () => {
  it('should create a Tree functor', () => {
    type Tree<K, V> = Bin<K, V> | Tip;

    type Bin<K, V> = {
      tag: 'bin';
      k: K;
      v: V;
      lhs: Tree<K, V>;
      rhs: Tree<K, V>;
    };
    const Bin = <K, V>(
      k: K,
      v: V,
      lhs: Tree<K, V>,
      rhs: Tree<K, V>,
    ): Tree<K, V> => ({ tag: 'bin', k, v, lhs, rhs });

    const Tip = { tag: 'tip' };
    type Tip = { tag: 'tip' };

    interface TreeK extends TyK<[unknown, unknown]> {
      [$type]: Tree<TyVar<this, 0>, TyVar<this, 1>>;
    }

    const TreeK = <K>(k: SchemaK<$<ConstK, [K]>>): SchemaK<$<TreeK, [K]>> =>
      SchemaK.sum('tag')({
        bin: SchemaK.struct({
          tag: SchemaK.literal('bin'),
          k: k,
          v: SchemaK.par,
          lhs: SchemaK.defer(() => TreeK(k)),
          rhs: SchemaK.defer(() => TreeK(k)),
        }),
        tip: SchemaK.struct({ tag: SchemaK.literal('tip') }),
      });

    const tf = TreeK(SchemaK.number).interpret(SchemableK.Functor);
    type tf = typeof tf;
    const node: Tree<number, string> = {
      tag: 'bin',
      k: 42,
      v: 'test',
      lhs: {
        tag: 'bin',
        k: 44,
        v: '55',
        lhs: { tag: 'tip' },
        rhs: { tag: 'tip' },
      },
      rhs: { tag: 'tip' },
    };

    const x = tf.map_(node, x => x.toUpperCase());
    const y = tf.map_(node, x => parseInt(x));

    console.log(x);
    console.log(y);
  });

  it('should create a Tree Option functor', () => {
    type Tree<K, V> = {
      k: K;
      v: V;
      lhs: Option<Tree<K, V>>;
      rhs: Option<Tree<K, V>>;
    };
    interface TreeK extends TyK<[unknown, unknown]> {
      [$type]: Tree<TyVar<this, 0>, TyVar<this, 1>>;
    }
    const TreeK = <K>(k: SchemaK<$<ConstK, [K]>>): SchemaK<$<TreeK, [K]>> =>
      SchemaK.struct({
        k: k,
        v: SchemaK.par,
        lhs: SchemaK.defer(() => TreeK(k)).optional,
        rhs: SchemaK.defer(() => TreeK(k)).optional,
      });

    const tf = TreeK(SchemaK.number).interpret(SchemableK.Functor);
    type tf = typeof tf;
    const node: Tree<number, string> = {
      k: 42,
      v: 'test',
      lhs: Some({ k: 44, v: '55', lhs: None, rhs: None }),
      rhs: None,
    };
    const x = tf.map_(node, x => x.toUpperCase());
    const y = tf.map_(node, x => parseInt(x));
    console.log(x);
    console.log(y);
  });
});
