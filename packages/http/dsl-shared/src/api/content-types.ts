// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { ContentType, MediaType } from '@fp4ts/http-core';

export class ContentTypeWithMime<M extends string> {
  public constructor(
    public readonly mime: M,
    public readonly self: ContentType,
  ) {}
}

export const attachMime = <M extends string>(
  m: M,
  ct: ContentType,
): ContentTypeWithMime<M> => new ContentTypeWithMime(m, ct);

export const JSON = attachMime(
  'application/json',
  new ContentType(MediaType['application/json']),
);
export type JSON = typeof JSON;

export const PlainText = attachMime(
  'text/plain',
  new ContentType(MediaType['text/plain']),
);
export type PlainText = typeof PlainText;
