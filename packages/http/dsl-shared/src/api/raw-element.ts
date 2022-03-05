// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { ApiElement, ElementTag } from './api-element';

export const RawElementTag = '@fp4ts/http/dsl-shared/raw';
export type RawElementTag = typeof RawElementTag;

export class RawElement implements ApiElement<RawElementTag> {
  [ElementTag]: RawElementTag;
}

export const Raw: RawElement = new RawElement();
