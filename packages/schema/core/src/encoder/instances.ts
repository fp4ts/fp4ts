// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Fix, id, Lazy, lazy, α, β, λ } from '@fp4ts/core';
import { Category, Compose, Contravariant, Functor } from '@fp4ts/cats';
import { Schemable } from '@fp4ts/schema-kernel';

import { EncoderF } from './encoder';
import {
  andThen_,
  compose_,
  contramap_,
  map_,
  nullable,
  optional,
} from './operators';
import {
  array,
  defer,
  lift,
  literal,
  product,
  record,
  struct,
  sum,
} from './constructors';

export const encoderFunctor: <A>() => Functor<λ<EncoderF, [α, Fix<A>]>> = () =>
  Functor.of({ map_ });

export const encoderContravariant: <O>() => Contravariant<
  $<EncoderF, [O]>
> = () => Contravariant.of({ contramap_ });

export const encoderCompose: Lazy<Compose<λ<EncoderF, [β, α]>>> = lazy(() =>
  Compose.of({ compose_, andThen_ }),
);

export const encoderCategory: Lazy<Category<λ<EncoderF, [β, α]>>> = lazy(
  () =>
    // TODO: fix type inference in nested monoid/monoid-k of the category
    Category.of({ ...encoderCompose(), id: <A>() => lift<A, A>(id) } as any),
);

export const encoderSchemable: Lazy<Schemable<λ<EncoderF, [Fix<unknown>, α]>>> =
  lazy(() =>
    Schemable.of({
      string: lift(id),
      number: lift(id),
      boolean: lift(id),
      null: lift(id),
      array: array,
      literal: literal,
      nullable: nullable,
      optional: optional,
      product: product as Schemable<λ<EncoderF, [Fix<unknown>, α]>>['product'],
      sum: sum as Schemable<λ<EncoderF, [Fix<unknown>, α]>>['sum'],
      record: record,
      struct: struct as Schemable<λ<EncoderF, [Fix<unknown>, α]>>['struct'],
      defer: defer,
      imap: (encoder, _f, g) => contramap_(encoder, g),
    }),
  );
