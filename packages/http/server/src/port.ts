// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { None, Option, Some } from '@fp4ts/cats';
import { newtype, TypeOf } from '@fp4ts/core';

const PortNT = newtype<number>()('@fp4ts/http/server/port');
export type Port = TypeOf<typeof PortNT>;

export const Port = Object.freeze({
  MinValue: 0,
  MaxValue: 65535,

  fromNumber(n: number): Option<Port> {
    return n >= Port.MinValue && n <= Port.MaxValue ? Some(PortNT(n)) : None;
  },

  fromString(value: string): Option<Port> {
    return Port.fromNumber(parseInt(value));
  },

  unapply(port: Port): number {
    return PortNT.unapply(port);
  },
});
