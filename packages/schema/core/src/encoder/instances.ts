// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Fix, id, Lazy, lazyVal, α, β, λ } from '@fp4ts/core';
import { Category, Compose, Contravariant, Functor } from '@fp4ts/cats';
import { EncoderK } from './encoder';
import { andThen_, compose_, contramap_, map_ } from './operators';
import { lift } from './constructors';

export const encoderFunctor: <A>() => Functor<λ<EncoderK, [α, Fix<A>]>> = () =>
  Functor.of({ map_ });

export const encoderContravariant: <O>() => Contravariant<
  $<EncoderK, [O]>
> = () => Contravariant.of({ contramap_ });

export const encoderCompose: Lazy<Compose<λ<EncoderK, [β, α]>>> = lazyVal(() =>
  Compose.of({ compose_, andThen_ }),
);

export const encoderCategory: Lazy<Compose<λ<EncoderK, [β, α]>>> = lazyVal(() =>
  // TODO: fix type inference in nested monoid/monoid-k of the category
  Category.of({ ...encoderCompose(), id: <A>() => lift<A, A>(id) } as any),
);
