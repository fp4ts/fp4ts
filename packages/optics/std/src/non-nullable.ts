// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Left, Right } from '@fp4ts/cats';
import { id } from '@fp4ts/core';
import { prism, Prism } from '@fp4ts/optics-core';

export function _NonNullable<S>(): Prism<S, NonNullable<S>> {
  return prism(s => (s != null ? Right(s) : Left(s)), id);
}
