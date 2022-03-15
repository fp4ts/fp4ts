// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Lazy, lazyVal } from '@fp4ts/core';
import { Constraining, Refining, Schemable } from '@fp4ts/schema-kernel';
import { Guard, SafeGuard, safeTest } from './algebra';
import {
  array,
  boolean,
  defer,
  literal,
  nullGuard,
  number,
  product,
  record,
  string,
  struct,
  sum,
} from './constructors';
import { GuardF } from './guard';
import {
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

export const guardRefining: Lazy<Refining<$<GuardF, [unknown]>>> = lazyVal(() =>
  Refining.of({
    refine_: refine_ as Refining<$<GuardF, [unknown]>>['refine_'],
  }),
);

export const guardSchemable: Lazy<Schemable<$<GuardF, [unknown]>>> = lazyVal(
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
      product: product as Schemable<$<GuardF, [unknown]>>['product'],
      record,
      sum,

      imap: <A, B>(
        ga: Guard<unknown, A>,
        f: (a: A) => B,
        g: (b: B) => A,
      ): Guard<unknown, B> => new SafeGuard(x => safeTest(ga, x)),
    }),
);

export const guardConstraining: Lazy<Constraining<$<GuardF, [unknown]>>> =
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
