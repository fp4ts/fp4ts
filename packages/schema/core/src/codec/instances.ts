// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Invariant } from '@fp4ts/cats';
import { $, Fix, Lazy, lazyVal, α, λ } from '@fp4ts/core';
import { Schemable } from '@fp4ts/schema-kernel';
import { Codec0, Codec } from './algebra';
import { CodecF } from './codec';
import {
  array,
  boolean,
  defer,
  literal,
  nullType,
  number,
  product,
  record,
  string,
  struct,
  sum,
} from './constructors';
import { imap_, nullable, optional } from './operators';

export const codecInvariant: <I, O>() => Invariant<$<CodecF, [I, O]>> = lazyVal(
  () => Invariant.of({ imap_: imap_ }),
);

export const codecSchemable: Lazy<Schemable<λ<CodecF, [Fix<unknown>, α, α]>>> =
  lazyVal(() =>
    Schemable.of({
      literal: literal as Schemable<λ<CodecF, [Fix<unknown>, α, α]>>['literal'],
      boolean: boolean,
      number: number,
      string: string,
      null: nullType,

      nullable: nullable,
      array: array,
      optional: optional,

      record: record,
      product: product as Schemable<λ<CodecF, [Fix<unknown>, α, α]>>['product'],
      struct: struct,
      sum: sum as Schemable<λ<CodecF, [Fix<unknown>, α, α]>>['sum'],
      defer: defer,
      imap: <A, B>(
        fa: Codec<unknown, A, A>,
        f: (a: A) => B,
        g: (b: B) => A,
      ) => {
        const fa0 = fa as Codec0<unknown, A, A>;
        return new Codec0(fa0.encoder.contramap(g).map(f), fa0.decoder.map(f));
      },
    }),
  );
