// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { ApiElement, ElementTag } from './api-element';

export abstract class BaseElement<T extends string> implements ApiElement<T> {
  abstract readonly [ElementTag]: T;
}
