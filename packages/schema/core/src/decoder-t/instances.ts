// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $ } from '@fp4ts/core';
import { Category, Functor, Monad, MonoidK, Profunctor } from '@fp4ts/cats';
import { Constraining, Refining, Schemable } from '@fp4ts/schema-kernel';

import {
  array,
  boolean,
  defer,
  empty,
  identity,
  literal,
  nullDecoderT,
  number,
  partial,
  product,
  record,
  string,
  struct,
  succeed,
  sum,
  tailRecM_,
} from './constructors';
import { DecoderTF } from './decoder-t';
import {
  adapt_,
  compose_,
  dimap_,
  flatMap_,
  intersection_,
  map_,
  maxExclusive_,
  maxLength_,
  max_,
  minExclusive_,
  minLength_,
  min_,
  nonEmpty,
  nullable,
  orElse_,
  refine_,
} from './operators';
import { DecoderT } from './algebra';

export const decoderTMonoidK: <F, I>(
  F: Monad<F>,
) => MonoidK<$<DecoderTF, [F, I]>> = F =>
  MonoidK.of({ emptyK: empty(F), combineK_: orElse_(F) });

export const decoderTFunctor: <F, I>(
  F: Functor<F>,
) => Functor<$<DecoderTF, [F, I]>> = F => Functor.of({ map_: map_(F) });

export const decoderTProfunctor: <F>(
  F: Functor<F>,
) => Profunctor<$<DecoderTF, [F]>> = F =>
  Profunctor.of({ dimap_: dimap_(F), lmap_: adapt_, rmap_: map_(F) });

export const decoderTCategory: <F>(
  F: Monad<F>,
) => Category<$<DecoderTF, [F]>> = F =>
  Category.of({ compose_: compose_(F), id: identity(F) });

export const decoderTMonad: <F, I>(
  F: Monad<F>,
) => Monad<$<DecoderTF, [F, I]>> = F =>
  Monad.of({
    ...decoderTFunctor(F),
    pure: succeed(F),
    flatMap_: flatMap_(F),
    tailRecM_: tailRecM_(F),
  });

export const decoderTRefining: <F>(
  F: Monad<F>,
) => Refining<$<DecoderTF, [F, unknown]>> = <F>(
  F: Monad<F>,
): Refining<$<DecoderTF, [F, unknown]>> =>
  Refining.of({
    refine_: refine_(F) as Refining<$<DecoderTF, [F, unknown]>>['refine_'],
  });

export const decoderTSchemable: <F>(
  F: Monad<F>,
) => Schemable<$<DecoderTF, [F, unknown]>> = <F>(
  F: Monad<F>,
): Schemable<$<DecoderTF, [F, unknown]>> =>
  Schemable.of({
    literal: literal(F),
    boolean: boolean(F),
    number: number(F),
    string: string(F),
    array: array(F),
    struct: struct(F),
    product: product(F) as Schemable<$<DecoderTF, [F, unknown]>>['product'],
    sum: sum(F),
    defer: defer,
    null: nullDecoderT(F),
    record: record(F),
    nullable: nullable(F),
    imap: <A, B>(
      da: DecoderT<F, unknown, A>,
      f: (a: A) => B,
      g: (b: B) => A,
    ): DecoderT<F, unknown, B> => map_(F)(da, f),
  });

export const decoderTConstraining: <F>(
  F: Monad<F>,
) => Constraining<$<DecoderTF, [F, unknown]>> = <F>(
  F: Monad<F>,
): Constraining<$<DecoderTF, [F, unknown]>> =>
  Constraining.of({
    ...decoderTSchemable(F),

    nonEmpty: nonEmpty(F) as Constraining<
      $<DecoderTF, [F, unknown]>
    >['nonEmpty'],
    min_: min_(F),
    minExclusive_: minExclusive_(F),
    max_: max_(F),
    maxExclusive_: maxExclusive_(F),

    minLength_: minLength_(F) as Constraining<
      $<DecoderTF, [F, unknown]>
    >['minLength_'],
    maxLength_: maxLength_(F) as Constraining<
      $<DecoderTF, [F, unknown]>
    >['maxLength_'],
  });
