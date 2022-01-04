// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Byte } from '@fp4ts/core';
import { PureK, Stream } from '@fp4ts/stream';

export type EntityBody<F> = Stream<F, Byte>;
export const EntityBody = Object.freeze({
  empty: <F = PureK>(): Stream<F, Byte> => Stream.empty(),
});
