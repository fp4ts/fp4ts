// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Either, Left, None, Option, Some } from '@fp4ts/cats';
import { iso, Iso, PPrism, prism, Prism } from '@fp4ts/optics-core';

export function _Some<A, B>(): PPrism<Option<A>, Option<B>, A, B>;
export function _Some<A>(): Prism<Option<A>, A>;
export function _Some<A>(): Prism<Option<A>, A> {
  return prism(o => o.toRight(() => o), Some);
}

export function _None<A>(): Prism<Option<A>, void> {
  return prism(
    o => (o.isEmpty ? Either.rightUnit : Left(o)),
    _ => None,
  );
}

export function _optional<A>(): Iso<A | undefined, Option<A>> {
  return iso(Option, o => o.getOrUndefined());
}

export function _nullable<A>(): Iso<A | null, Option<A>> {
  return iso(Option, o => o.getOrNull());
}
