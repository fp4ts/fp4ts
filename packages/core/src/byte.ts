// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Char } from './char';

declare const byteTag: unique symbol;
/** A number from inclusive range 0-255 */
export type Byte = number & { tag: typeof byteTag };

export const Byte = Object.freeze({
  toChar: (x: Byte) => Char.fromByte(x),
  toNumber: (x: Byte) => x as number,

  fromChar: (c: Char) => Char.toByte(c),
  fromNumber: (x: number): Byte => (x & 0xff) as Byte,
  fromNumberOrNull: (x: number): Byte | null =>
    x >= 0 && x <= 255 ? (x as Byte) : null,
  unsafeFromNumber: (x: number): Byte => x as Byte,
});
