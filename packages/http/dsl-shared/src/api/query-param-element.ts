// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { TypeRef } from '@fp4ts/core';
import { ElementTag } from './api-element';
import { BaseElement } from './base-element';

export const QueryTag = '@fp4ts/http/dsl-shared/query';
export type QueryTag = typeof QueryTag;

export class QueryElement<
  P extends string,
  T extends TypeRef<any, any>,
> extends BaseElement<QueryTag> {
  public readonly [ElementTag] = QueryTag;
  public constructor(public readonly property: P, public readonly type: T) {
    super();
  }
}

export function QueryParam<P extends string, T extends TypeRef<any, any>>(
  property: P,
  type: T,
): QueryElement<P, T> {
  return new QueryElement(property, type);
}
