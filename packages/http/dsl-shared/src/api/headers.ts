// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { TypeRef } from '@fp4ts/core';
import { HeaderElement, RawHeaderElement } from './header-element';

export class HeadersElement<
  H extends (HeaderElement<any> | RawHeaderElement<any, any>)[],
  A extends TypeRef<any, any>,
> {
  public constructor(public readonly headers: H, public readonly body: A) {}
}

export const Headers =
  <H extends (HeaderElement<any> | RawHeaderElement<any, any>)[]>(
    ...headers: H
  ) =>
  <A extends TypeRef<any, any>>(body: A): HeadersElement<H, A> =>
    new HeadersElement(headers, body);
