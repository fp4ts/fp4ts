// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Eq, List } from '@fp4ts/cats';
import { checkAll, forAll, IsEq } from '@fp4ts/cats-test-kit';
import { Schema, SchemableK } from '@fp4ts/schema-kernel';
import { Codec, Decoder, Encoder } from '@fp4ts/schema-core';
import { CodecSuite } from '@fp4ts/schema-laws';
import { AndString, GenericAdt, IList, Snoc, Tree } from '../adt-definitions';

describe('Codec derivation', () => {
  const SnocEqK = Snoc.schemaK.interpret(SchemableK.EqK);
  const IListEqK = IList.schemaK.interpret(SchemableK.EqK);
  const TreeEqK = Tree.schemaK.interpret(SchemableK.EqK);
  const GenericAdtEqK = GenericAdt.schemaK.interpret(SchemableK.EqK);
  const AndStringEqK = AndString.schemaK.interpret(SchemableK.EqK);
  const NumStrEq = Eq.tuple(Eq.primitive, Eq.primitive);

  test('encode-decode to be stack safe', () => {
    const ixs = IList.fromList(List.range(0, 50_000));
    const sxs = Snoc.fromList(List.range(0, 50_000));
    const ic = IList.schemaK.toSchema(Schema.number).interpret(Codec.Schemable);
    const sc = Snoc.schemaK.toSchema(Schema.number).interpret(Codec.Schemable);

    expect(IList.toList(ic.decode(ic.encode(ixs)).value.value.get)).toEqual(
      List.range(0, 50_000),
    );
    expect(Snoc.toList(sc.decode(sc.encode(sxs)).value.value.get)).toEqual(
      List.range(0, 50_000),
    );
  });

  test('encoder-decoder to be stack safe', () => {
    const ixs = IList.fromList(List.range(0, 50_000));
    const sxs = Snoc.fromList(List.range(0, 50_000));
    const ie = IList.schemaK
      .toSchema(Schema.number)
      .interpret(Encoder.Schemable);
    const id = IList.schemaK
      .toSchema(Schema.number)
      .interpret(Decoder.Schemable);
    const se = Snoc.schemaK
      .toSchema(Schema.number)
      .interpret(Encoder.Schemable);
    const sd = Snoc.schemaK
      .toSchema(Schema.number)
      .interpret(Decoder.Schemable);

    expect(IList.toList(id.decode(ie.encode(ixs)).value.value.get)).toEqual(
      List.range(0, 50_000),
    );
    expect(Snoc.toList(sd.decode(se.encode(sxs)).value.value.get)).toEqual(
      List.range(0, 50_000),
    );
  });

  const EqAny = Eq.of({
    equals: (x, y) => {
      expect(x).toEqual(y);
      return true;
    },
  });

  function testCodec<A>(
    type: string,
    S: Schema<A>,
    E: Eq<A>,
    arbA: Arbitrary<A>,
  ) {
    const C = S.interpret(Codec.Schemable);
    const E_ = S.interpret(Encoder.Schemable);
    const D = S.interpret(Decoder.Schemable);

    const arbT = fc.oneof(arbA, fc.object());
    checkAll(
      `Codec<unknown, unknown, ${type}>`,
      CodecSuite(C).codec(arbA, arbT, E, EqAny),
    );
    test(
      `Decoder<unknown, ${type}> <-> Encoder<unknown, ${type}>`,
      forAll(arbA, a => new IsEq(D.decode(E_.encode(a)).value.value.get, a))(E),
    );
  }

  testCodec(
    'IList<number>',
    IList.schemaK.toSchema(Schema.number),
    IListEqK.liftEq(Eq.primitive),
    IList.arb(fc.integer()),
  );
  testCodec(
    'IList<[number, string]>',
    IList.schemaK.toSchema(Schema.product(Schema.number, Schema.string)),
    IListEqK.liftEq(NumStrEq),
    IList.arb(fc.tuple(fc.integer(), fc.string())),
  );

  testCodec(
    'Snoc<number>',
    Snoc.schemaK.toSchema(Schema.number),
    SnocEqK.liftEq(Eq.primitive),
    Snoc.arb(fc.integer()),
  );
  testCodec(
    'Snoc<[number, string]>',
    Snoc.schemaK.toSchema(Schema.product(Schema.number, Schema.string)),
    SnocEqK.liftEq(NumStrEq),
    Snoc.arb(fc.tuple(fc.integer(), fc.string())),
  );

  testCodec(
    'Tree<number>',
    Tree.schemaK.toSchema(Schema.number),
    TreeEqK.liftEq(Eq.primitive),
    Tree.arb(fc.integer()),
  );
  testCodec(
    'Tree<[number, string]>',
    Tree.schemaK.toSchema(Schema.product(Schema.number, Schema.string)),
    TreeEqK.liftEq(NumStrEq),
    Tree.arb(fc.tuple(fc.integer(), fc.string())),
  );

  testCodec(
    'GenericAdt<number>',
    GenericAdt.schemaK.toSchema(Schema.number),
    GenericAdtEqK.liftEq(Eq.primitive),
    GenericAdt.arb(fc.integer()),
  );
  testCodec(
    'GenericAdt<[number, string]>',
    GenericAdt.schemaK.toSchema(Schema.product(Schema.number, Schema.string)),
    GenericAdtEqK.liftEq(NumStrEq),
    GenericAdt.arb(fc.tuple(fc.integer(), fc.string())),
  );

  testCodec(
    'AndString<number>',
    AndString.schemaK.toSchema(Schema.number),
    AndStringEqK.liftEq(Eq.primitive),
    AndString.arb(fc.integer()),
  );
  testCodec(
    'AndString<[number, string]>',
    AndString.schemaK.toSchema(Schema.product(Schema.number, Schema.string)),
    AndStringEqK.liftEq(NumStrEq),
    AndString.arb(fc.tuple(fc.integer(), fc.string())),
  );
});
