// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Eval } from '@fp4ts/core';
import { Eq, List, CommutativeMonoid, Monoid } from '@fp4ts/cats';
import { FoldableSuite } from '@fp4ts/cats-laws';
import { checkAll } from '@fp4ts/cats-test-kit';
import { SchemableK } from '@fp4ts/schema-kernel';
import { AndString, GenericAdt, IList, Snoc, Tree } from '../adt-definitions';

describe('Foldable derivation', () => {
  const SnocF = Snoc.schemaK.interpret(SchemableK.Foldable);
  const IListF = IList.schemaK.interpret(SchemableK.Foldable);
  const TreeF = Tree.schemaK.interpret(SchemableK.Foldable);
  const GenericAdtF = GenericAdt.schemaK.interpret(SchemableK.Foldable);
  const AndStringF = AndString.schemaK.interpret(SchemableK.Foldable);

  const n = 50_000;
  const ixs = IList.fromList(List.range(0, n));
  const sxs = Snoc.fromList(List.range(0, n));
  test('foldLeft to be stack safe', () => {
    const expected = (n * (n - 1)) / 2;

    expect(IListF.foldLeft_(ixs, 0, (a, b) => a + b)).toBe(expected);
    expect(SnocF.foldLeft_(sxs, 0, (a, b) => a + b)).toBe(expected);
  });
  test('foldRight to be stack safe', () => {
    const expected = (n * (n - 1)) / 2;

    expect(
      IListF.foldRight_(ixs, Eval.zero, (a, eb) => eb.map(b => a + b)).value,
    ).toBe(expected);
    expect(
      SnocF.foldRight_(sxs, Eval.zero, (a, eb) => eb.map(b => a + b)).value,
    ).toBe(expected);
  });

  checkAll(
    'Functor<IList<*>>',
    FoldableSuite(IListF).foldable(
      fc.integer(),
      fc.string(),
      CommutativeMonoid.addition,
      Monoid.string,
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      IList.arb,
    ),
  );

  checkAll(
    'Functor<Snoc<*>>',
    FoldableSuite(SnocF).foldable(
      fc.integer(),
      fc.string(),
      CommutativeMonoid.addition,
      Monoid.string,
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Snoc.arb,
    ),
  );

  checkAll(
    'Functor<Tree<*>>',
    FoldableSuite(TreeF).foldable(
      fc.integer(),
      fc.string(),
      CommutativeMonoid.addition,
      Monoid.string,
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Tree.arb,
    ),
  );

  checkAll(
    'Functor<GenericAdt<*>>',
    FoldableSuite(GenericAdtF).foldable(
      fc.integer(),
      fc.string(),
      CommutativeMonoid.addition,
      Monoid.string,
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      GenericAdt.arb,
    ),
  );

  checkAll(
    'Functor<AndString<*>>',
    FoldableSuite(AndStringF).foldable(
      fc.integer(),
      fc.string(),
      CommutativeMonoid.addition,
      Monoid.string,
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      AndString.arb,
    ),
  );
});
