// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { pipe } from '@fp4ts/core';
import { Fold } from './fold';
import { Getter } from './getter';
import { PIso } from './iso';
import { AnyOptical } from './optics';
import { PLens } from './lens';
import { POptional } from './optional';
import { PPrism } from './prism';
import { PSetter } from './setter';
import { PTraversal } from './traversal';

/* eslint-disable prettier/prettier */
export function compose_<S, T, A, B, C, D>(l: PIso<S, T, A, B>, r: PIso<A, B, C, D>): PIso<S, T, C, D>;
export function compose_<S, T, A, B, C, D>(l: PLens<S, T, A, B>, r: PLens<A, B, C, D>): PLens<S, T, C, D>;
export function compose_<S, T, A, B, C, D>(l: PPrism<S, T, A, B>, r: PPrism<A, B, C, D>): PPrism<S, T, C, D>;
export function compose_<S, T, A, B, C, D>(l: POptional<S, T, A, B>, r: POptional<A, B, C, D>): POptional<S, T, C, D>;
export function compose_<S, T, A, B, C, D>(l: PTraversal<S, T, A, B>, r: PTraversal<A, B, C, D>): PTraversal<S, T, C, D>;
export function compose_<S, T, A, B, C, D>(l: PSetter<S, T, A, B>, r: PSetter<A, B, C, D>): PSetter<S, T, C, D>;
export function compose_<S, A, C>(l: Getter<S, A>, r: Getter<A, C>): Getter<S, C>;
export function compose_<S, A, C>(l: Fold<S, A>, r: Fold<A, C>): Fold<S, C>;
export function compose_<S, T, A, B, C, D>(l: AnyOptical<S, T, A, B>, r: AnyOptical<A, B, C, D>): AnyOptical<S, T, C, D>;
export function compose_<S, T, A, B, C, D>(l: AnyOptical<S, T, A, B>, r: AnyOptical<A, B, C, D>): AnyOptical<S, T, C, D> {
  return (F: any, P: any, Q: any = P) => (pcfd: any) =>
    pipe(
      pcfd,
      r(F, P, Q),
      l(F, Q, Q),
    );
}


