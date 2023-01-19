// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { add, complete, cycle, suite } from 'benny';
import { Decoder, Guard } from '@fp4ts/schema-core';
import { Schema, TypeOf } from '@fp4ts/schema-kernel';

const Person = Schema.struct({
  name: Schema.string,
  age: Schema.number,
});
type Person = TypeOf<typeof Person>;

const PersonD = Person.interpret(Decoder.Schemable);
const PersonG = Person.interpret(Guard.Schemable);

const good: Person = {
  name: 'Alice',
  age: 42,
};

const bad = {};

suite(
  'Decoder Simple',
  add('Guard (good)', () => {
    PersonG.test(good);
  }),
  add('Guard (bad)', () => {
    PersonG.test(bad);
  }),
  add('Decode<Identity, *, *> (good)', () => {
    PersonD.decode(good);
  }),
  add('Decode<Identity, *, *> (bad)', () => {
    PersonD.decode(bad);
  }),

  cycle(),
  complete(),
);
