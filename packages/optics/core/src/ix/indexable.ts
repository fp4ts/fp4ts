// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, id, instance, Kind, lazyVal } from '@fp4ts/core';
import { Function1F, IdentityF, Tuple2LF } from '@fp4ts/cats';
import { Cojoined } from '@fp4ts/optics-kernel';
import { Indexed, IndexedF } from './indexed';

export interface Indexable<P, I, RepF = any, CorepF = any>
  extends Cojoined<P, RepF, CorepF> {
  indexed<A, B>(pab: Kind<P, [A, B]>): (a: A, i: I) => B;
}

export const Indexable = Object.freeze({
  Function1<I>(): Indexable<Function1F, I, IdentityF, IdentityF> {
    return function1Indexable();
  },

  Indexed<I>(): Indexable<
    $<IndexedF, [I]>,
    I,
    $<Function1F, [I]>,
    Tuple2LF<I>
  > {
    return indexedIndexable();
  },
});

// -- Instances

const function1Indexable: <I>() => Indexable<
  Function1F,
  I,
  IdentityF,
  IdentityF
> = lazyVal(<I>() =>
  instance<Indexable<Function1F, I, IdentityF, IdentityF>>({
    ...Cojoined.Function1,
    indexed: id,
  }),
);

const indexedIndexable: <I>() => Indexable<
  $<IndexedF, [I]>,
  I,
  $<Function1F, [I]>,
  Tuple2LF<I>
> = lazyVal(<I>() =>
  instance<Indexable<$<IndexedF, [I]>, I, $<Function1F, [I]>, Tuple2LF<I>>>({
    ...Indexed.Cojoined<I>(),
    indexed: id,
  }),
) as <I>() => Indexable<$<IndexedF, [I]>, I, $<Function1F, [I]>, Tuple2LF<I>>;
