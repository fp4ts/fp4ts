// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Hashable } from '../../../hashable';

import { List } from '../list';
import { Empty, HashMap } from './algebra';
import { insert_ } from './operators';

export const empty: HashMap<never, never> = Empty;

export const of =
  <K2>(H: Hashable<K2>) =>
  <K extends K2, V>(...xs: [K, V][]): HashMap<K2, V> =>
    fromArray(H)(xs);

export const fromArray =
  <K2>(H: Hashable<K2>) =>
  <K extends K2, V>(xs: [K, V][]): HashMap<K2, V> =>
    xs.reduce((m, [k, v]) => insert_(H, m, k, v), empty as HashMap<K2, V>);

export const fromList =
  <K2>(H: Hashable<K2>) =>
  <K extends K2, V>(xs: List<[K, V]>): HashMap<K2, V> =>
    xs.foldLeft(empty as HashMap<K2, V>, (m, [k, v]) => insert_(H, m, k, v));

export const m: HashMap<number, number> = empty;
