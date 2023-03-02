// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, id, Kind, lazy } from '@fp4ts/core';
import { Function1F, IdentityF, TupleLeftF } from '@fp4ts/cats';
import { Conjoined } from './conjoined';
import { Indexed, IndexedF } from './indexed';

/**
 * @category Type Class
 */
export interface Indexable<P, in I, F = any, C = any>
  extends Conjoined<P, F, C> {
  indexed<A, B>(pab: Kind<P, [A, B]>): (a: A, i: I) => B;
}

export const Indexable = Object.freeze({
  get Function1(): Indexable<Function1F, unknown, IdentityF, IdentityF> {
    return functionIndexable();
  },

  Indexed: <I>(): Indexable<
    $<IndexedF, [I]>,
    I,
    $<Function1F, [I]>,
    TupleLeftF<I>
  > => indexedIndexable<I>(),
});

// -- Instances

export type Function1Indexable = Indexable<
  Function1F,
  unknown,
  IdentityF,
  IdentityF
>;
export type IndexedIndexable<I> = Indexable<
  $<IndexedF, [I]>,
  I,
  $<Function1F, [I]>,
  TupleLeftF<I>
>;

const functionIndexable = lazy(
  (): Indexable<Function1F, unknown, IdentityF, IdentityF> => ({
    ...Conjoined.Function1,

    indexed: f => (a, _i) => f(a),
  }),
);

const indexedIndexable = lazy(
  <I>(): Indexable<$<IndexedF, [I]>, I, $<Function1F, [I]>, TupleLeftF<I>> => ({
    ...Indexed.Cojoined<I>(),
    indexed: id,
  }),
) as <I>() => Indexable<$<IndexedF, [I]>, I, $<Function1F, [I]>, TupleLeftF<I>>;
