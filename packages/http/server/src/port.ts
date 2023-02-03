// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { None, Option, Some } from '@fp4ts/cats';
import { subtype } from '@fp4ts/core';

export const Port = class extends subtype<number>()('@fp4ts/http/server/port') {
  static readonly MinValue = 0;
  static readonly MaxValue = 65535;

  static fromNumber(n: number): Option<Port> {
    return n >= Port.MinValue && n <= Port.MaxValue
      ? Some(this.unsafeWrap(n))
      : None;
  }

  static fromString(value: string): Option<Port> {
    return this.fromNumber(parseInt(value));
  }
};
export type Port = typeof Port['Type'];
