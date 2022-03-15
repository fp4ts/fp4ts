// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { List, None } from '@fp4ts/cats';
import { forAll } from '@fp4ts/cats-test-kit';
import { Schema } from '@fp4ts/schema-kernel';
import { Guard } from '@fp4ts/schema-core';
import {
  AndString,
  GenericAdt,
  GenericAdtCase,
  IList,
  Snoc,
  Tree,
} from '../adt-definitions';

describe.skip('Guard derivation', () => {
  test('test to be stack safe', () => {
    const ixs = IList.fromList(List.range(0, 50_000));
    const sxs = Snoc.fromList(List.range(0, 50_000));
    const id = IList.schemaK.toSchema(Schema.number).interpret(Guard.Schemable);
    const sd = Snoc.schemaK.toSchema(Schema.number).interpret(Guard.Schemable);

    expect(id.test(ixs)).toBe(true);
    expect(sd.test(sxs)).toBe(true);
  });

  function testGuard<A>(type: string, S: Schema<A>, arbA: Arbitrary<A>) {
    const G = S.interpret(Guard.Schemable);
    test(
      `Guard<${type}>`,
      forAll(arbA, a => G.test(a)),
    );
  }

  test('something', () => {
    const G = GenericAdt.schemaK
      .toSchema(Schema.string)
      .interpret(Guard.Schemable);

    G.test(new GenericAdtCase(None));
  });

  testGuard(
    'IList<number>',
    IList.schemaK.toSchema(Schema.number),
    IList.arb(fc.integer()),
  );
  testGuard(
    'IList<[number, string]>',
    IList.schemaK.toSchema(Schema.product(Schema.number, Schema.string)),
    IList.arb(fc.tuple(fc.integer(), fc.string())),
  );

  testGuard(
    'Snoc<number>',
    Snoc.schemaK.toSchema(Schema.number),
    Snoc.arb(fc.integer()),
  );
  testGuard(
    'Snoc<[number, string]>',
    Snoc.schemaK.toSchema(Schema.product(Schema.number, Schema.string)),
    Snoc.arb(fc.tuple(fc.integer(), fc.string())),
  );

  testGuard(
    'Tree<number>',
    Tree.schemaK.toSchema(Schema.number),
    Tree.arb(fc.integer()),
  );
  testGuard(
    'Tree<[number, string]>',
    Tree.schemaK.toSchema(Schema.product(Schema.number, Schema.string)),
    Tree.arb(fc.tuple(fc.integer(), fc.string())),
  );

  testGuard(
    'GenericAdt<number>',
    GenericAdt.schemaK.toSchema(Schema.number),
    GenericAdt.arb(fc.integer()),
  );
  testGuard(
    'GenericAdt<[number, string]>',
    GenericAdt.schemaK.toSchema(Schema.product(Schema.number, Schema.string)),
    GenericAdt.arb(fc.tuple(fc.integer(), fc.string())),
  );

  testGuard(
    'AndString<number>',
    AndString.schemaK.toSchema(Schema.number),
    AndString.arb(fc.integer()),
  );
  testGuard(
    'AndString<[number, string]>',
    AndString.schemaK.toSchema(Schema.product(Schema.number, Schema.string)),
    AndString.arb(fc.tuple(fc.integer(), fc.string())),
  );
});
