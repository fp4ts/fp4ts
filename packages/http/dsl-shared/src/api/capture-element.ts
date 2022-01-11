// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Type } from '../type';
import { booleanType, numberType, stringType } from '../types';
import { ElementTag } from './api-element';
import { BaseElement } from './base-element';

export const CaptureTag = '@fp4ts/http/dsl-shared/capture';
export type CaptureTag = typeof CaptureTag;

export class CaptureElement<
  P extends string,
  T extends Type<any, any>,
> extends BaseElement<CaptureTag> {
  public readonly [ElementTag] = CaptureTag;

  public constructor(public readonly property: P, public readonly type: T) {
    super();
  }
}

export const Capture = Object.freeze({
  boolean: <P extends string>(prop: P): CaptureElement<P, booleanType> =>
    new CaptureElement(prop, booleanType),
  number: <P extends string>(prop: P): CaptureElement<P, numberType> =>
    new CaptureElement(prop, numberType),
  string: <P extends string>(prop: P): CaptureElement<P, stringType> =>
    new CaptureElement(prop, stringType),
});
