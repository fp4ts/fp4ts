// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { TypeRef } from '@fp4ts/core';
import { ElementTag } from './api-element';
import { BaseElement } from './base-element';

export const BasicAuthTag = '@fp4ts/http/dsl-shared/basic-auth';
export type BasicAuthTag = typeof BasicAuthTag;

export class BasicAuthElement<
  N extends string,
  A extends TypeRef<any, any>,
> extends BaseElement<BasicAuthTag> {
  public readonly [ElementTag] = BasicAuthTag;

  public constructor(public readonly realm: N, public readonly userData: A) {
    super();
  }
}

export function BasicAuth<N extends string, A extends TypeRef<any, any>>(
  realm: N,
  userData: A,
): BasicAuthElement<N, A> {
  return new BasicAuthElement(realm, userData);
}
