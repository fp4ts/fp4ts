// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Eq, List } from '@fp4ts/cats';
import { forAll, IsEq } from '@fp4ts/cats-test-kit';
import { Schema, SchemableK } from '@fp4ts/schema-kernel';
import { Decoder } from '@fp4ts/schema-core';
import { AndString, GenericAdt, IList, Snoc, Tree } from '../adt-definitions';

describe('Decoder derivation', () => {
  const SnocEqK = Snoc.schemaK.interpret(SchemableK.EqK);
  const IListEqK = IList.schemaK.interpret(SchemableK.EqK);
  const TreeEqK = Tree.schemaK.interpret(SchemableK.EqK);
  const GenericAdtEqK = GenericAdt.schemaK.interpret(SchemableK.EqK);
  const AndStringEqK = AndString.schemaK.interpret(SchemableK.EqK);
  const NumStrEq = Eq.tuple(Eq.primitive, Eq.primitive);

  test('decode Eval to be stack safe', () => {
    const ixs = IList.fromList(List.range(0, 50_000));
    const sxs = Snoc.fromList(List.range(0, 50_000));
    const id = IList.schemaK
      .toSchema(Schema.number)
      .interpret(Decoder.Schemable);
    const sd = Snoc.schemaK
      .toSchema(Schema.number)
      .interpret(Decoder.Schemable);

    expect(id.decode(ixs).value.value.isRight).toBe(true);
    expect(sd.decode(sxs).value.value.isRight).toBe(true);
  });

  function testDecoder<A>(
    type: string,
    S: Schema<A>,
    E: Eq<A>,
    arbA: Arbitrary<A>,
  ) {
    const D = S.interpret(Decoder.Schemable);
    test(
      `Decoder<Eval, *, ${type}>`,
      forAll(arbA, a => new IsEq(D.decode(a).value.value.get, a))(E),
    );
  }

  testDecoder(
    'IList<number>',
    IList.schemaK.toSchema(Schema.number),
    IListEqK.liftEq(Eq.primitive),
    IList.arb(fc.integer()),
  );
  testDecoder(
    'IList<[number, string]>',
    IList.schemaK.toSchema(Schema.product(Schema.number, Schema.string)),
    IListEqK.liftEq(NumStrEq),
    IList.arb(fc.tuple(fc.integer(), fc.string())),
  );

  testDecoder(
    'Snoc<number>',
    Snoc.schemaK.toSchema(Schema.number),
    SnocEqK.liftEq(Eq.primitive),
    Snoc.arb(fc.integer()),
  );
  testDecoder(
    'Snoc<[number, string]>',
    Snoc.schemaK.toSchema(Schema.product(Schema.number, Schema.string)),
    SnocEqK.liftEq(NumStrEq),
    Snoc.arb(fc.tuple(fc.integer(), fc.string())),
  );

  testDecoder(
    'Tree<number>',
    Tree.schemaK.toSchema(Schema.number),
    TreeEqK.liftEq(Eq.primitive),
    Tree.arb(fc.integer()),
  );
  testDecoder(
    'Tree<[number, string]>',
    Tree.schemaK.toSchema(Schema.product(Schema.number, Schema.string)),
    TreeEqK.liftEq(NumStrEq),
    Tree.arb(fc.tuple(fc.integer(), fc.string())),
  );

  testDecoder(
    'GenericAdt<number>',
    GenericAdt.schemaK.toSchema(Schema.number),
    GenericAdtEqK.liftEq(Eq.primitive),
    GenericAdt.arb(fc.integer()),
  );
  testDecoder(
    'GenericAdt<[number, string]>',
    GenericAdt.schemaK.toSchema(Schema.product(Schema.number, Schema.string)),
    GenericAdtEqK.liftEq(NumStrEq),
    GenericAdt.arb(fc.tuple(fc.integer(), fc.string())),
  );

  testDecoder(
    'AndString<number>',
    AndString.schemaK.toSchema(Schema.number),
    AndStringEqK.liftEq(Eq.primitive),
    AndString.arb(fc.integer()),
  );
  testDecoder(
    'AndString<[number, string]>',
    AndString.schemaK.toSchema(Schema.product(Schema.number, Schema.string)),
    AndStringEqK.liftEq(NumStrEq),
    AndString.arb(fc.tuple(fc.integer(), fc.string())),
  );
});
