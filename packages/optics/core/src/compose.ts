// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, compose as composeF } from '@fp4ts/core';
import { Indexable, IndexedF } from './ix';
import { Fold, IndexedFold } from './fold';
import { Getter, IndexedGetter } from './getter';
import { PIso } from './iso';
import { AnyIndexedOptical, AnyOptical } from './optics';
import { IndexedPLens, PLens } from './lens';
import { PPrism } from './prism';
import { IndexedPSetter, PSetter } from './setter';
import { IndexedPTraversal, PTraversal } from './traversal';
import { Review } from './review';

/* eslint-disable prettier/prettier */
export function compose<S, T, A, B, C, D>(f: PIso<S, T, A, B>, g: PIso<A, B, C, D>): PIso<S, T, C, D>;
export function compose<S, T, A, B, C, D>(f: PLens<S, T, A, B>, g: PLens<A, B, C, D>): PLens<S, T, C, D>;
export function compose<S, T, A, B, C, D>(f: PPrism<S, T, A, B>, g: PPrism<A, B, C, D>): PPrism<S, T, C, D>;
export function compose<T, B, D>(f: Review<T, B>, g: Review<B, D>): Review<T, D>;
export function compose<S, T, A, B, C, D>(f: PTraversal<S, T, A, B>, g: PTraversal<A, B, C, D>): PTraversal<S, T, C, D>;
export function compose<S, T, A, B, C, D>(f: PSetter<S, T, A, B>, g: PSetter<A, B, C, D>): PSetter<S, T, C, D>;
export function compose<S, A, C>(f: Getter<S, A>, g: Getter<A, C>): Getter<S, C>;
export function compose<S, A, C>(f: Fold<S, A>, g: Fold<A, C>): Fold<S, C>;
export function compose<S, T, A, B, C, D>(f: AnyOptical<S, T, A, B>, g: AnyOptical<A, B, C, D>): AnyOptical<S, T, C, D>;
export function compose<S, T, A, B, C, D>(f: AnyOptical<S, T, A, B>, g: AnyOptical<A, B, C, D>): AnyOptical<S, T, C, D> {
  return (F, P, Q) =>
    composeF(
      f(F, P, Q),
      g(F, P, Q),
    );
}

export function icomposeL<I, S, T, A, B, C, D>(f: IndexedPLens<I, S, T, A, B>, g: PLens<A, B, C, D>): IndexedPLens<I, S, T, C, D>;
export function icomposeL<I, S, T, A, B, C, D>(f: IndexedPTraversal<I, S, T, A, B>, g: PLens<A, B, C, D>): IndexedPTraversal<I, S, T, C, D>;
export function icomposeL<I, S, T, A, B, C, D>(f: IndexedPSetter<I, S, T, A, B>, g: PLens<A, B, C, D>): IndexedPSetter<I, S, T, C, D>;
export function icomposeL<I, S, A, C>(f: IndexedGetter<I, S, A>, g: Getter<A, C>): IndexedGetter<I, S, C>;
export function icomposeL<I, S, A, C>(f: IndexedFold<I, S, A>, g: Fold<A, C>): IndexedFold<I, S, C>;
export function icomposeL<I, S, T, A, B, C, D>(f: AnyIndexedOptical<I, S, T, A, B>, g: AnyOptical<A, B, C, D>): AnyIndexedOptical<I, S, T, C, D>;
export function icomposeL<I, S, T, A, B, C, D>(f: AnyIndexedOptical<I, S, T, A, B>, g: AnyOptical<A, B, C, D>): AnyIndexedOptical<I, S, T, C, D> {
  return (F, P, Q) => 
    h => f(F, P, Q)((a, i) => g(F, Q, Q)(c => h(c, i))(a));
}

export function icomposeR<I, S, T, A, B, C, D>(f: PLens<S, T, A, B>, g: IndexedPLens<I, A, B, C, D>): IndexedPLens<I, S, T, C, D>;
export function icomposeR<I, S, T, A, B, C, D>(f: PTraversal<S, T, A, B>, g: IndexedPLens<I, A, B, C, D>): IndexedPTraversal<I, S, T, C, D>;
export function icomposeR<I, S, T, A, B, C, D>(f: PSetter<S, T, A, B>, g: IndexedPLens<I, A, B, C, D>): IndexedPSetter<I, S, T, C, D>;
export function icomposeR<I, S, A, C>(f: Getter<S, A>, g: IndexedGetter<I, A, C>): IndexedGetter<I, S, C>;
export function icomposeR<I, S, A, C>(f: Fold<S, A>, g: IndexedFold<I, A, C>): IndexedFold<I, S, C>;
export function icomposeR<I, S, T, A, B, C, D>(f: AnyOptical<S, T, A, B>, g: AnyIndexedOptical<I, A, B, C, D>): AnyIndexedOptical<I, S, T, C, D>;
export function icomposeR<I, S, T, A, B, C, D>(f: AnyOptical<S, T, A, B>, g: AnyIndexedOptical<I, A, B, C, D>): AnyIndexedOptical<I, S, T, C, D> {
  return (F, P, Q) =>
    composeF(
      f(F, Q, Q),
      g(F, P, Q),
    );
}


export function icompose<I, J, S, T, A, B, C, D>(f: IndexedPLens<I, S, T, A, B>, g: IndexedPLens<J, A, B, C, D>): IndexedPLens<[I, J], S, T, C, D>;
export function icompose<I, J, S, T, A, B, C, D>(f: IndexedPTraversal<I, S, T, A, B>, g: IndexedPLens<J, A, B, C, D>): IndexedPTraversal<[I, J], S, T, C, D>;
export function icompose<I, J, S, T, A, B, C, D>(f: IndexedPSetter<I, S, T, A, B>, g: IndexedPLens<J, A, B, C, D>): IndexedPSetter<[I, J], S, T, C, D>;
export function icompose<I, J, S, A, C>(f: IndexedGetter<I, S, A>, g: IndexedGetter<J, A, C>): IndexedGetter<[I, J], S, C>;
export function icompose<I, J, S, A, C>(f: IndexedFold<I, S, A>, g: IndexedFold<J, A, C>): IndexedFold<[I, J], S, C>;
export function icompose<I, J, S, T, A, B, C, D>(f: AnyIndexedOptical<I, S, T, A, B>, g: AnyIndexedOptical<J, A, B, C, D>): AnyIndexedOptical<[I, J], S, T, C, D>;
export function icompose<I, J, S, T, A, B, C, D>(f: AnyIndexedOptical<I, S, T, A, B>, g: AnyIndexedOptical<J, A, B, C, D>): AnyIndexedOptical<[I, J], S, T, C, D> {
  return (F, P, Q) => 
    h => f(F, P as any as Indexable<$<IndexedF, [I]>, I, any, any>, Q)((a, i) => g(F, P as any as Indexable<$<IndexedF, [J]>, J, any, any>, Q)((c, j) => h(c, [i, j]))(a));
}
