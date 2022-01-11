// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Fix, id, Lazy, lazyVal, α, β, λ } from '@fp4ts/core';
import { Category, Compose, Contravariant, Functor } from '@fp4ts/cats';
import { Schemable } from '@fp4ts/schema-kernel';

import { EncoderK } from './encoder';
import {
  andThen_,
  compose_,
  contramap_,
  intersection_,
  map_,
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

export const encoderFunctor: <A>() => Functor<λ<EncoderK, [α, Fix<A>]>> = () =>
  Functor.of({ map_ });

export const encoderContravariant: <O>() => Contravariant<
  $<EncoderK, [O]>
> = () => Contravariant.of({ contramap_ });

export const encoderCompose: Lazy<Compose<λ<EncoderK, [β, α]>>> = lazyVal(() =>
  Compose.of({ compose_, andThen_ }),
);

export const encoderCategory: Lazy<Category<λ<EncoderK, [β, α]>>> = lazyVal(
  () =>
    // TODO: fix type inference in nested monoid/monoid-k of the category
    Category.of({ ...encoderCompose(), id: <A>() => lift<A, A>(id) } as any),
);

export const encoderSchemable: Lazy<Schemable<λ<EncoderK, [α, α]>>> = lazyVal(
  () =>
    Schemable.of({
      string: lift(id),
      number: lift(id),
      boolean: lift(id),
      null: lift(id),
      array: array,
      intersection_: intersection_,
      literal: literal,
      nullable: nullable,
      partial: partial as Schemable<λ<EncoderK, [α, α]>>['partial'],
      product: product as Schemable<λ<EncoderK, [α, α]>>['product'],
      sum: sum as Schemable<λ<EncoderK, [α, α]>>['sum'],
      record: record,
      struct: struct as Schemable<λ<EncoderK, [α, α]>>['struct'],
      defer: defer,
    }),
);
