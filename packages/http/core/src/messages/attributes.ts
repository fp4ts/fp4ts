// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { OrderedMap } from '@fp4ts/cats';

export type Attributes = OrderedMap<string, string>;
export const Attributes = Object.freeze({
  empty: OrderedMap.empty,
});
