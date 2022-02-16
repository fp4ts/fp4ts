// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Arbitrary } from 'fast-check';
import { $type, TyK, TyVar } from '@fp4ts/core';
import { Option } from '@fp4ts/cats';
import { SchemaK } from '@fp4ts/schema-kernel';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

export abstract class GenericAdt<A> {
  private readonly __void!: void;

  public static arb<A>(arbA: Arbitrary<A>): Arbitrary<GenericAdt<A>> {
    return A.fp4tsOption(arbA).map(fa => new GenericAdtCase(fa));
  }

  public static schemaK: SchemaK<GenericAdtF> = SchemaK.sum('tag')({
    case: SchemaK.struct({
      tag: SchemaK.literal('case'),
      value: SchemaK.par.optional,
    }),
  }).imap(
    ({ value }) => new GenericAdtCase(value),
    <A>(x: GenericAdt<A>) => ({
      tag: 'case',
      value: (x as GenericAdtCase<A>).value,
    }),
  );
}
export class GenericAdtCase<A> extends GenericAdt<A> {
  public readonly tag = 'case';
  public constructor(public readonly value: Option<A>) {
    super();
  }
}

export interface GenericAdtF extends TyK<[unknown]> {
  [$type]: GenericAdt<TyVar<this, 0>>;
}
