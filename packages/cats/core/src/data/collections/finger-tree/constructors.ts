// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { List } from '../list';

import { Measured } from './measured';
import { FingerTree, Single, Empty } from './algebra';
import { append_ } from './operators';

export const pure = <V, A>(a: A): FingerTree<V, A> => new Single(a);

export const empty = <V>(): FingerTree<V, never> => Empty;

export const singleton = <V, A>(a: A): FingerTree<V, A> => pure(a);

export const of =
  <V, A>(M: Measured<A, V>) =>
  (...xs: A[]): FingerTree<V, A> =>
    fromArray(M)(xs);

export const fromArray =
  <V, A>(M: Measured<A, V>) =>
  (xs: A[]): FingerTree<V, A> =>
    xs.reduce(append_(M), empty() as FingerTree<V, A>);

export const fromList =
  <V, A>(M: Measured<A, V>) =>
  (xs: List<A>): FingerTree<V, A> =>
    xs.foldLeft(empty() as FingerTree<V, A>, append_(M));
