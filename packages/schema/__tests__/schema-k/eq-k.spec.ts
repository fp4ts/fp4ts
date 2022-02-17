// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Eq, List } from '@fp4ts/cats';
import { EqSuite } from '@fp4ts/cats-laws';
import { checkAll } from '@fp4ts/cats-test-kit';
import { SchemableK } from '@fp4ts/schema-kernel';
import { AndString, GenericAdt, IList, Snoc, Tree } from '../adt-definitions';

describe('EqK derivation', () => {
  const IListEqK = IList.schemaK.interpret(SchemableK.EqK);
  const SnocEqK = Snoc.schemaK.interpret(SchemableK.EqK);
  const TreeEqK = Tree.schemaK.interpret(SchemableK.EqK);
  const GenericAdtEqK = GenericAdt.schemaK.interpret(SchemableK.EqK);
  const AndStringEqK = AndString.schemaK.interpret(SchemableK.EqK);

  const EqStringNumber = Eq.tuple2(
    Eq.primitive as Eq<string>,
    Eq.primitive as Eq<number>,
  );
  const arbStringNumber = fc.tuple(fc.string(), fc.integer());

  test('equals to be stack safe', () => {
    const ixs = IList.fromList(List.range(0, 50_000));
    const sxs = Snoc.fromList(List.range(0, 50_000));

    expect(IListEqK.liftEq(Eq.primitive).equals(ixs, ixs)).toBe(true);
    expect(SnocEqK.liftEq(Eq.primitive).equals(sxs, sxs)).toBe(true);
  });

  checkAll(
    'Eq<IList<number>>',
    EqSuite(IListEqK.liftEq(Eq.primitive as Eq<number>)).eq(
      IList.arb(fc.integer()),
    ),
  );
  checkAll(
    'Eq<IList<[string, number]>>',
    EqSuite(IListEqK.liftEq(EqStringNumber)).eq(IList.arb(arbStringNumber)),
  );

  checkAll(
    'Eq<Snoc<number>>',
    EqSuite(SnocEqK.liftEq(Eq.primitive as Eq<number>)).eq(
      Snoc.arb(fc.integer()),
    ),
  );
  checkAll(
    'Eq<Snoc<[string, number]>>',
    EqSuite(SnocEqK.liftEq(EqStringNumber)).eq(Snoc.arb(arbStringNumber)),
  );

  checkAll(
    'Eq<Tree<number>>',
    EqSuite(TreeEqK.liftEq(Eq.primitive as Eq<number>)).eq(
      Tree.arb(fc.integer()),
    ),
  );
  checkAll(
    'Eq<Tree<[string, number]>>',
    EqSuite(TreeEqK.liftEq(EqStringNumber)).eq(Tree.arb(arbStringNumber)),
  );

  checkAll(
    'Eq<GenericAdt<number>>',
    EqSuite(GenericAdtEqK.liftEq(Eq.primitive as Eq<number>)).eq(
      GenericAdt.arb(fc.integer()),
    ),
  );
  checkAll(
    'Eq<GenericAdt<[string, number]>>',
    EqSuite(GenericAdtEqK.liftEq(EqStringNumber)).eq(
      GenericAdt.arb(arbStringNumber),
    ),
  );

  checkAll(
    'Eq<AndString<number>>',
    EqSuite(AndStringEqK.liftEq(Eq.primitive as Eq<number>)).eq(
      AndString.arb(fc.integer()),
    ),
  );
  checkAll(
    'Eq<AndString<[string, number]>>',
    EqSuite(AndStringEqK.liftEq(EqStringNumber)).eq(
      AndString.arb(arbStringNumber),
    ),
  );
});
