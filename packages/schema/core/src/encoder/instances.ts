// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Fix, id, Lazy, lazyVal, α, β, λ } from '@fp4ts/core';
import { Category, Compose, Contravariant, Functor } from '@fp4ts/cats';
import { Schemable } from '@fp4ts/schema-kernel';

import { EncoderF } from './encoder';
import {
  andThen_,
  compose_,
  contramap_,
  intersection_,
  map_,
  optional,
  nullable,
} from './operators';
import {
  array,
  defer,
  lift,
  literal,
  partial,
  product,
  record,
  struct,
  sum,
} from './constructors';
import { Encoder, safeEncode, SafeEncoder } from './algebra';

export const encoderFunctor: <A>() => Functor<λ<EncoderF, [α, Fix<A>]>> = () =>
  Functor.of({ map_ });

export const encoderContravariant: <O>() => Contravariant<
  $<EncoderF, [O]>
> = () => Contravariant.of({ contramap_ });

export const encoderCompose: Lazy<Compose<λ<EncoderF, [β, α]>>> = lazyVal(() =>
  Compose.of({ compose_, andThen_ }),
);

export const encoderCategory: Lazy<Category<λ<EncoderF, [β, α]>>> = lazyVal(
  () =>
    // TODO: fix type inference in nested monoid/monoid-k of the category
    Category.of({ ...encoderCompose(), id: <A>() => lift<A, A>(id) } as any),
);

export const encoderSchemable: Lazy<Schemable<λ<EncoderF, [α, α]>>> = lazyVal(
  () =>
    Schemable.of({
      string: lift(id),
      number: lift(id),
      boolean: lift(id),
      null: lift(id),
      optional,
      array: array,
      literal: literal,
      nullable: nullable,
      product: product as Schemable<λ<EncoderF, [α, α]>>['product'],
      sum: sum as Schemable<λ<EncoderF, [α, α]>>['sum'],
      record: record,
      struct: struct as Schemable<λ<EncoderF, [α, α]>>['struct'],
      defer: defer,
      imap: <A, B>(
        ea: Encoder<A, A>,
        f: (a: A) => B,
        g: (b: B) => A,
      ): Encoder<B, B> => new SafeEncoder(a => safeEncode(ea, g(a)).map(f)),
    }),
);
