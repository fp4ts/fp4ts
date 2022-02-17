// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { List } from '@fp4ts/cats';
import { EqSuite } from '@fp4ts/cats-laws';
import { checkAll } from '@fp4ts/cats-test-kit';
import { Schema, Schemable } from '@fp4ts/schema-kernel';
import { AndString, GenericAdt, IList, Snoc, Tree } from '../adt-definitions';

describe('Eq derivation', () => {
  const IListEq = IList.schemaK.toSchema(Schema.number).interpret(Schemable.Eq);
  const SnocEq = Snoc.schemaK.toSchema(Schema.number).interpret(Schemable.Eq);
  const TreeEq = Tree.schemaK.toSchema(Schema.number).interpret(Schemable.Eq);
  const GenericAdtEq = GenericAdt.schemaK
    .toSchema(Schema.number)
    .interpret(Schemable.Eq);
  const AndStringEq = AndString.schemaK
    .toSchema(Schema.number)
    .interpret(Schemable.Eq);

  test('equals to be stack safe', () => {
    const ixs = IList.fromList(List.range(0, 50_000));
    const sxs = Snoc.fromList(List.range(0, 50_000));

    expect(IListEq.equals(ixs, ixs)).toBe(true);
    expect(SnocEq.equals(sxs, sxs)).toBe(true);
  });

  checkAll('Eq<IList<number>>', EqSuite(IListEq).eq(IList.arb(fc.integer())));
  checkAll('Eq<Snoc<number>>', EqSuite(SnocEq).eq(Snoc.arb(fc.integer())));
  checkAll('Eq<Tree<number>>', EqSuite(TreeEq).eq(Tree.arb(fc.integer())));
  checkAll(
    'Eq<GenericAdt<number>>',
    EqSuite(GenericAdtEq).eq(GenericAdt.arb(fc.integer())),
  );
  checkAll(
    'Eq<AndString<number>>',
    EqSuite(AndStringEq).eq(AndString.arb(fc.integer())),
  );
});
