// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { TypeRef } from '@fp4ts/core';
import { SelectHeader } from '@fp4ts/http-core';
import { ElementTag } from './api-element';
import { BaseElement } from './base-element';

export const HeaderTag = '@fp4ts/http/dsl-shared/header';
export type HeaderTag = typeof HeaderTag;

export class HeaderElement<
  H extends SelectHeader<any, any>,
> extends BaseElement<HeaderTag> {
  public readonly [ElementTag] = HeaderTag;

  public constructor(public readonly header: H) {
    super();
  }
}

export const RawHeaderTag = '@fp4ts/http/dsl-shared/raw-header';
export type RawHeaderTag = typeof RawHeaderTag;

export class RawHeaderElement<
  H extends string,
  T extends TypeRef<any, any>,
> extends BaseElement<RawHeaderTag> {
  public readonly [ElementTag] = RawHeaderTag;

  public constructor(public readonly key: H, public readonly type: T) {
    super();
  }
}

export function Header<H extends SelectHeader<any, any>>(
  header: H,
): HeaderElement<H>;
export function Header<H extends string, T extends TypeRef<any, any>>(
  header: H,
  type: T,
): RawHeaderElement<H, T>;
export function Header(header: any, type?: any): any {
  return type == null
    ? new HeaderElement(header)
    : new RawHeaderElement(header, type);
}
