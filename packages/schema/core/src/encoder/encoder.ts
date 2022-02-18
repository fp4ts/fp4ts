// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, Fix, TyK, TyVar, α, β, λ } from '@fp4ts/core';
import { Category, Compose, Contravariant, Functor } from '@fp4ts/cats';
import { Encoder as EncoderBase } from './algebra';
import {
  array,
  defer,
  lift,
  partial,
  product,
  record,
  struct,
  sum,
} from './constructors';
import {
  encoderCategory,
  encoderCompose,
  encoderContravariant,
  encoderFunctor,
  encoderSchemable,
} from './instances';
import { OutputOf, TypeOf } from './types';
import { Schemable } from '@fp4ts/schema-kernel';

export type Encoder<O, A> = EncoderBase<O, A>;

export const Encoder: EncoderObj = function <O, A>(f: (a: A) => O) {
  return lift(f);
} as any;

interface EncoderObj {
  <O, A>(f: (a: A) => O): Encoder<O, A>;

  lift<O, A>(f: (a: A) => O): Encoder<O, A>;
  array<O, A>(fa: Encoder<O, A>): Encoder<O[], A[]>;
  struct<P extends Record<string, Encoder<any, any>>>(
    xs: P,
  ): Encoder<
    { [k in keyof P]: OutputOf<P[k]> },
    { [k in keyof P]: TypeOf<P[k]> }
  >;
  partial<P extends Record<string, Encoder<any, any>>>(
    xs: P,
  ): Encoder<
    Partial<{ [k in keyof P]: OutputOf<P[k]> }>,
    Partial<{ [k in keyof P]: TypeOf<P[k]> }>
  >;
  record<O, A>(
    fa: Encoder<O, A>,
  ): Encoder<Record<string, O>, Record<string, A>>;
  product<P extends Encoder<any, any>[]>(
    ...xs: P
  ): Encoder<
    { [k in keyof P]: OutputOf<P[k]> },
    { [k in keyof P]: TypeOf<P[k]> }
  >;
  sum<T extends string>(
    tag: T,
  ): <P extends Record<string, Encoder<any, any>>>(
    xs: P,
  ) => Encoder<OutputOf<P[keyof P]>, TypeOf<P[keyof P]>>;
  defer<O, A>(thunk: () => Encoder<O, A>): Encoder<O, A>;

  // Instances

  Functor<A>(): Functor<λ<EncoderF, [α, Fix<A>]>>;
  Contravariant<O>(): Contravariant<$<EncoderF, [O]>>;
  readonly Compose: Compose<λ<EncoderF, [β, α]>>;
  readonly Category: Category<λ<EncoderF, [β, α]>>;
  readonly Schemable: Schemable<λ<EncoderF, [α, α]>>;
}

Encoder.lift = lift;
Encoder.array = array;
Encoder.struct = struct;
Encoder.partial = partial;
Encoder.record = record;
Encoder.product = product;
Encoder.sum = sum;
Encoder.defer = defer;

Encoder.Functor = encoderFunctor;
Encoder.Contravariant = encoderContravariant;
Object.defineProperty(Encoder, 'Compose', {
  get() {
    return encoderCompose();
  },
});
Object.defineProperty(Encoder, 'Category', {
  get() {
    return encoderCategory();
  },
});
Object.defineProperty(Encoder, 'Schemable', {
  get() {
    return encoderSchemable();
  },
});

// -- HKT

export interface EncoderF extends TyK<[unknown, unknown]> {
  [$type]: Encoder<TyVar<this, 0>, TyVar<this, 1>>;
}
