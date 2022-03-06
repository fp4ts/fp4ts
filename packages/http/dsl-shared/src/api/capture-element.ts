// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { TypeRef } from '@fp4ts/core';
import { ElementTag } from './api-element';
import { BaseElement } from './base-element';

export const CaptureTag = '@fp4ts/http/dsl-shared/capture';
export type CaptureTag = typeof CaptureTag;

export class CaptureElement<
  P extends string,
  T extends TypeRef<any, any>,
> extends BaseElement<CaptureTag> {
  public readonly [ElementTag] = CaptureTag;

  public constructor(public readonly property: P, public readonly type: T) {
    super();
  }
}

export function Capture<P extends string, T extends TypeRef<any, any>>(
  prop: P,
  type: T,
): CaptureElement<P, T> {
  return new CaptureElement(prop, type);
}
