// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Lazy, lazyVal } from '@fp4ts/core';
import { Constraining } from '@fp4ts/schema-kernel/src/constraining';
import { Refining } from '@fp4ts/schema-kernel/src/refining';
import { Schemable } from '@fp4ts/schema-kernel/src/schemable';
import {
  array,
  boolean,
  defer,
  literal,
  nullGuard,
  number,
  partial,
  product,
  record,
  string,
  struct,
  sum,
} from './constructors';
import { GuardK } from './guard';
import {
  intersection_,
  maxExclusive_,
  maxLength_,
  max_,
  minExclusive_,
  minLength_,
  min_,
  nonEmpty,
  nullable,
  refine_,
} from './operators';

export const guardRefining: Lazy<Refining<$<GuardK, [unknown]>>> = lazyVal(() =>
  Refining.of({
    refine_: refine_ as Refining<$<GuardK, [unknown]>>['refine_'],
  }),
);

export const guardSchemable: Lazy<Schemable<$<GuardK, [unknown]>>> = lazyVal(
  () =>
    Schemable.of({
      literal,
      boolean,
      string,
      number,
      null: nullGuard,
      array,
      struct,
      defer,
      nullable,
      product: product as Schemable<$<GuardK, [unknown]>>['product'],
      record,
      sum,
    }),
);

export const guardConstraining: Lazy<Constraining<$<GuardK, [unknown]>>> =
  lazyVal(() =>
    Constraining.of({
      ...guardSchemable(),

      min_: min_,
      minExclusive_: minExclusive_,
      max_: max_,
      maxExclusive_: maxExclusive_,

      nonEmpty: nonEmpty,

      minLength_: minLength_,
      maxLength_: maxLength_,
    }),
  );
