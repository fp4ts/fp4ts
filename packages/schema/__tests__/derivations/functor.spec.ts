// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Eq, List } from '@fp4ts/cats';
import { FunctorSuite } from '@fp4ts/cats-laws';
import { checkAll } from '@fp4ts/cats-test-kit';
import { SchemableK } from '@fp4ts/schema-kernel';
import { AndString, GenericAdt, IList, Snoc, Tree } from '../adt-definitions';

describe('Functor derivation', () => {
  const SnocF = Snoc.schemaK.interpret(SchemableK.Functor);
  const SnocEqK = Snoc.schemaK.interpret(SchemableK.EqK);

  const IListF = IList.schemaK.interpret(SchemableK.Functor);
  const IListEqK = IList.schemaK.interpret(SchemableK.EqK);

  const TreeF = Tree.schemaK.interpret(SchemableK.Functor);
  const TreeEqK = Tree.schemaK.interpret(SchemableK.EqK);

  const GenericAdtF = GenericAdt.schemaK.interpret(SchemableK.Functor);
  const GenericAdtEqK = GenericAdt.schemaK.interpret(SchemableK.EqK);

  const AndStringF = AndString.schemaK.interpret(SchemableK.Functor);
  const AndStringEqK = AndString.schemaK.interpret(SchemableK.EqK);

  test('map to be stack safe', () => {
    const ixs = IList.fromList(List.range(0, 50_000));
    const sxs = Snoc.fromList(List.range(0, 50_000));
    const expected = List.range(1, 50_001);

    expect(IList.toList(IListF.map_(ixs, x => x + 1)).toArray).toEqual(
      expected.toArray,
    );
    expect(Snoc.toList(SnocF.map_(sxs, x => x + 1)).toArray).toEqual(
      expected.toArray,
    );
  });

  checkAll(
    'Functor<IList<*>>',
    FunctorSuite(IListF).functor(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      IList.arb,
      IListEqK.liftEq,
    ),
  );

  checkAll(
    'Functor<Snoc<*>>',
    FunctorSuite(SnocF).functor(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Snoc.arb,
      SnocEqK.liftEq,
    ),
  );

  checkAll(
    'Functor<Tree<*>>',
    FunctorSuite(TreeF).functor(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      Tree.arb,
      TreeEqK.liftEq,
    ),
  );

  checkAll(
    'Functor<GenericAdt<*>>',
    FunctorSuite(GenericAdtF).functor(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      GenericAdt.arb,
      GenericAdtEqK.liftEq,
    ),
  );

  checkAll(
    'Functor<AndString<*>>',
    FunctorSuite(AndStringF).functor(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.fromUniversalEquals(),
      Eq.fromUniversalEquals(),
      AndString.arb,
      AndStringEqK.liftEq,
    ),
  );
});
