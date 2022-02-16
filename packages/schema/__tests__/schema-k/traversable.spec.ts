// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Eq, Eval, List, Monoid, Option, Some } from '@fp4ts/cats';
import { TraversableSuite } from '@fp4ts/cats-laws';
import { checkAll } from '@fp4ts/cats-test-kit';
import { SchemableK } from '@fp4ts/schema-kernel';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import { AndString, GenericAdt, IList, Snoc, Tree } from '../adt-definitions';

describe('Traversable derivation', () => {
  const SnocF = Snoc.schemaK.interpret(SchemableK.Traversable);
  const SnocEqK = Snoc.schemaK.interpret(SchemableK.EqK);

  const IListF = IList.schemaK.interpret(SchemableK.Traversable);
  const IListEqK = IList.schemaK.interpret(SchemableK.EqK);

  const TreeF = Tree.schemaK.interpret(SchemableK.Traversable);
  const TreeEqK = Tree.schemaK.interpret(SchemableK.EqK);

  const GenericAdtF = GenericAdt.schemaK.interpret(SchemableK.Traversable);
  const GenericAdtEqK = GenericAdt.schemaK.interpret(SchemableK.EqK);

  const AndStringF = AndString.schemaK.interpret(SchemableK.Traversable);
  const AndStringEqK = AndString.schemaK.interpret(SchemableK.EqK);

  const n = 50_000;
  const ixs = IList.fromList(List.range(0, n));
  const sxs = Snoc.fromList(List.range(0, n));

  test('map to be stack safe', () => {
    const expected = List.range(1, 50_001);

    expect(IList.toList(IListF.map_(ixs, x => x + 1))).toEqual(expected);
    expect(Snoc.toList(SnocF.map_(sxs, x => x + 1))).toEqual(expected);
  });

  test('traverse to be stack safe', () => {
    const expected = Some(List.range(1, 50_001));

    expect(
      IListF.traverse_(Option.Applicative)(ixs, x => Some(x + 1)).map(
        IList.toList,
      ),
    ).toEqual(expected);
    expect(
      SnocF.traverse_(Option.Applicative)(sxs, x => Some(x + 1)).map(
        Snoc.toList,
      ),
    ).toEqual(expected);
  });

  test('foldLeft to be stack safe', () => {
    const expected = (n * (n - 1)) / 2;

    expect(IListF.foldLeft_(ixs, 0, (a, b) => a + b)).toBe(expected);
    expect(SnocF.foldLeft_(sxs, 0, (a, b) => a + b)).toBe(expected);
  });

  test('foldRight to be stack safe', () => {
    const expected = (n * (n - 1)) / 2;

    expect(
      IListF.foldRight_(ixs, Eval.now(0), (a, eb) => eb.map(b => a + b)).value,
    ).toBe(expected);
    expect(
      SnocF.foldRight_(sxs, Eval.now(0), (a, eb) => eb.map(b => a + b)).value,
    ).toBe(expected);
  });

  checkAll(
    'Traversable<IList<*>>',
    TraversableSuite(IListF).traversable(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Monoid.addition,
      Monoid.addition,
      IListF,
      Option.Applicative,
      Option.Applicative,
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      IList.arb,
      IListEqK.liftEq,
      A.fp4tsOption,
      Option.Eq,
      A.fp4tsOption,
      Option.Eq,
    ),
  );

  checkAll(
    'Traversable<Snoc<*>>',
    TraversableSuite(SnocF).traversable(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Monoid.addition,
      Monoid.addition,
      SnocF,
      Option.Applicative,
      Option.Applicative,
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      Snoc.arb,
      SnocEqK.liftEq,
      A.fp4tsOption,
      Option.Eq,
      A.fp4tsOption,
      Option.Eq,
    ),
  );

  checkAll(
    'Traversable<Tree<*>>',
    TraversableSuite(TreeF).traversable(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Monoid.addition,
      Monoid.addition,
      TreeF,
      Option.Applicative,
      Option.Applicative,
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      Tree.arb,
      TreeEqK.liftEq,
      A.fp4tsOption,
      Option.Eq,
      A.fp4tsOption,
      Option.Eq,
    ),
  );

  checkAll(
    'Traversable<GenericAdt<*>>',
    TraversableSuite(GenericAdtF).traversable(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Monoid.addition,
      Monoid.addition,
      GenericAdtF,
      Option.Applicative,
      Option.Applicative,
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      GenericAdt.arb,
      GenericAdtEqK.liftEq,
      A.fp4tsOption,
      Option.Eq,
      A.fp4tsOption,
      Option.Eq,
    ),
  );

  checkAll(
    'Traversable<AndString<*>>',
    TraversableSuite(AndStringF).traversable(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Monoid.addition,
      Monoid.addition,
      AndStringF,
      Option.Applicative,
      Option.Applicative,
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      AndString.arb,
      AndStringEqK.liftEq,
      A.fp4tsOption,
      Option.Eq,
      A.fp4tsOption,
      Option.Eq,
    ),
  );
});
