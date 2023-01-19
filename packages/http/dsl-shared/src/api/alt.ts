// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { ApiElement, ElementTag } from './api-element';

export const AltTag = '@fp4ts/http/dsl-shared/alt';
export type AltTag = typeof AltTag;

export class Alt<A extends unknown[]> implements ApiElement<AltTag> {
  public readonly [ElementTag] = AltTag;
  public constructor(public readonly xs: A) {}
}

export const group = <A extends [unknown, ...unknown[]]>(...xs: A): Alt<A> =>
  new Alt(xs);
