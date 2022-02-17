// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { add, complete, cycle, suite } from 'benny';
import { Identity } from '@fp4ts/cats';
import { DecoderT, Guard } from '@fp4ts/schema-core';
import { Schema, TypeOf } from '@fp4ts/schema-kernel';

const Type = Schema.struct({
  number: Schema.number,
  negNumber: Schema.number,
  maxNumber: Schema.number,
  string: Schema.string,
  longString: Schema.string,
  boolean: Schema.boolean,
  deeplyNested: Schema.struct({
    foo: Schema.string,
    num: Schema.number,
    bool: Schema.boolean,
  }),
});
type Type = TypeOf<typeof Type>;

const PersonD = Type.interpret(DecoderT.Schemable(Identity.Monad));
const PersonG = Type.interpret(Guard.Schemable);

const good: Type = {
  number: 1,
  negNumber: -1,
  maxNumber: Number.MAX_VALUE,
  string: 'string',
  longString:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Vivendum intellegat et qui, ei denique consequuntur vix. Semper aeterno percipit ut his, sea ex utinam referrentur repudiandae. No epicuri hendrerit consetetur sit, sit dicta adipiscing ex, in facete detracto deterruisset duo. Quot populo ad qui. Sit fugit nostrum et. Ad per diam dicant interesset, lorem iusto sensibus ut sed. No dicam aperiam vis. Pri posse graeco definitiones cu, id eam populo quaestio adipiscing, usu quod malorum te. Ex nam agam veri, dicunt efficiantur ad qui, ad legere adversarium sit. Commune platonem mel id, brute adipiscing duo an. Vivendum intellegat et qui, ei denique consequuntur vix. Offendit eleifend moderatius ex vix, quem odio mazim et qui, purto expetendis cotidieque quo cu, veri persius vituperata ei nec. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
  boolean: true,
  deeplyNested: {
    foo: 'bar',
    num: 1,
    bool: false,
  },
};

suite(
  'Decoder Larger',
  add('Guard (good)', () => {
    PersonG.test(good);
  }),
  add.only('Decode<Identity, *, *> (good)', () => {
    PersonD.decode(good);
  }),

  cycle(),
  complete(),
);
