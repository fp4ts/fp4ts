// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Fold } from '../fold';
import { Getter } from '../getter';
import { PIso } from '../iso';
import { PLens } from '../lens';
import { POptional } from '../optional';
import { PPrism } from '../prism';
import { PSetter } from '../setter';
import { PTraversal } from '../traversal';

export function isFold<S, A>(
  l: Fold<S, A> | PSetter<S, any, A, any>,
): l is Fold<S, A> {
  return l instanceof Fold || isGetter(l) || isTraversal(l);
}
export function isGetter<S, A>(
  l: Fold<S, A> | PSetter<S, any, A, any>,
): l is Getter<S, A> {
  return l instanceof Getter || isLens(l);
}
export function isSetter<S, T, A, B>(
  l: Fold<S, A> | PSetter<S, T, A, B>,
): l is PSetter<S, T, A, B> {
  return l instanceof PSetter || isTraversal(l);
}
export function isTraversal<S, T, A, B>(
  l: Fold<S, A> | PSetter<S, T, A, B>,
): l is PTraversal<S, T, A, B> {
  return l instanceof PTraversal || isOptional(l);
}
export function isOptional<S, T, A, B>(
  l: Fold<S, A> | PSetter<S, T, A, B>,
): l is POptional<S, T, A, B> {
  return l instanceof POptional || isLens(l) || isPrism(l);
}
export function isLens<S, T, A, B>(
  l: Fold<S, A> | PSetter<S, T, A, B>,
): l is PLens<S, T, A, B> {
  return l instanceof PLens || isIso(l);
}
export function isPrism<S, T, A, B>(
  l: Fold<S, A> | PSetter<S, T, A, B>,
): l is PPrism<S, T, A, B> {
  return l instanceof PPrism || isIso(l);
}
export function isIso<S, T, A, B>(
  l: Fold<S, A> | PSetter<S, T, A, B>,
): l is PIso<S, T, A, B> {
  return l instanceof PIso;
}
