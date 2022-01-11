// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { ApiElement } from './api-element';
import { Sub } from './sub';

// prettier-ignore
export type MapSub<e extends ApiElement<any>, xs extends unknown[]> =
  xs extends [infer x, ...infer xs]
    ? x extends ApiElement<any>
      ? [Sub<e, x>, ...MapSub<e, xs>]
    : never
  : []

// prettier-ignore
export type AppendList<xs extends unknown[], ys extends unknown[]> =
  xs extends [infer x, ...infer xs]
    ? [x, ...AppendList<xs, ys>]
  : []
