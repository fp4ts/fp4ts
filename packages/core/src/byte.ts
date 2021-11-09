import { Char } from './char';

declare const byteTag: unique symbol;
/** A number from inclusive range 0-255 */
export type Byte = number & { tag: typeof byteTag };

export const Byte = Object.freeze({
  toChar: (x: Byte) => Char.fromByte(x),
  toNumber: (x: Byte) => x as number,

  fromChar: (c: Char) => Char.toByte(c),
  fromNumber: (x: number): Byte => (x & 0xff) as Byte,
  unsafeFromNumber: (x: number): Byte => x as Byte,
});
