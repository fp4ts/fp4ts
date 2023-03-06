// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Byte } from '@fp4ts/core';
import { Monad, None, Option, Some } from '@fp4ts/cats';
import { List } from '@fp4ts/collections';

export abstract class IpAddress {
  private readonly __void!: void;

  public abstract fold<A>(
    v4: (ip: Ipv4Address) => A,
    v6: (ip: Ipv6Address) => A,
  ): A;

  public abstract toString(): string;
  public abstract toBytes(): Byte[];

  public static fromString(value: string): Option<IpAddress> {
    return Ipv4Address.fromString(value)['<|>']<IpAddress>(() =>
      Ipv6Address.fromString(value),
    );
  }

  public static fromBytes(bytes: Byte[]): Option<IpAddress> {
    return Ipv4Address.fromBytes(bytes)['<|>']<IpAddress>(() =>
      Ipv6Address.fromBytes(bytes),
    );
  }
}

export class Ipv4Address extends IpAddress {
  private constructor(private readonly bytes: Byte[]) {
    super();
  }

  public fold<A>(v4: (ip: Ipv4Address) => A, v6: (ip: Ipv6Address) => A): A {
    return v4(this);
  }

  public toBytes(): Byte[] {
    return [...this.bytes];
  }

  public override toString(): string {
    const bytes = this.bytes;
    // prettier-ignore
    return `${bytes[0] & 0xff}.${bytes[1] & 0xff}.${bytes[2] & 0xff}.${bytes[3] & 0xff}`;
  }

  public static override fromString(value: string): Option<Ipv4Address> {
    const fields = value.trim().split('.');
    if (fields.length !== 4) return None;

    const bytes = new Array<Byte>(4);
    for (let i = 0; i < 4; i++) {
      const n = parseInt(fields[i], 10);
      if (Number.isNaN(n)) return None;
      const x = Byte.fromNumberOrNull(n);
      if (x === null) return None;
      bytes[i] = x;
    }

    return Some(this.unsafeFromBytes(bytes));
  }

  public static override fromBytes(bytes: Byte[]): Option<Ipv4Address> {
    return bytes.length === 4 ? Some(this.unsafeFromBytes(bytes)) : None;
  }

  public static get local(): Ipv4Address {
    return Ipv4Address.fromString('127.0.0.1').get;
  }

  private static unsafeFromBytes(bytes: Byte[]): Ipv4Address {
    return new Ipv4Address([...bytes]);
  }
}

export class Ipv6Address extends IpAddress {
  private constructor(private readonly bytes: Byte[]) {
    super();
  }

  public fold<A>(v4: (ip: Ipv4Address) => A, v6: (ip: Ipv6Address) => A): A {
    return v6(this);
  }

  public toBytes(): Byte[] {
    return [...this.bytes];
  }

  public override toString(): string {
    const fields = new Array<number>(8);
    const bytes = this.bytes;
    let condensing = false;
    let condensedStart = -1;
    let maxCondensedStart = -1;
    let condensedLength = 0;
    let maxCondensedLength = 0;
    let idx = 0;
    while (idx < 8) {
      const j = 2 * idx;
      const field = ((0x0ff & bytes[j]) << 8) | (0x0ff & bytes[j + 1]);
      fields[idx] = field;
      if (field === 0) {
        if (!condensing) {
          condensing = true;
          condensedStart = idx;
          condensedLength = 0;
        }
        condensedLength += 1;
      } else {
        condensing = false;
      }
      if (condensedLength > maxCondensedLength) {
        maxCondensedLength = condensedLength;
        maxCondensedStart = condensedStart;
      }
      idx += 1;
    }
    if (maxCondensedLength == 1) maxCondensedStart = -1;
    let acc: string = '';
    idx = 0;
    while (idx < 8) {
      if (idx == maxCondensedStart) {
        acc += '::';
        idx += maxCondensedLength;
      } else {
        const hextet = fields[idx].toString(16);
        acc += hextet;
        idx += 1;
        if (idx < 8 && idx != maxCondensedStart) acc += ':';
      }
    }
    return acc;
  }

  public toMixedString(): string {
    const bytes = this.toBytes();
    const v4 = Ipv4Address.fromBytes(bytes.slice(12, 16)).get;
    bytes[12] = 0 as Byte;
    bytes[13] = 1 as Byte;
    bytes[14] = 0 as Byte;
    bytes[15] = 1 as Byte;
    const s = Ipv6Address.unsafeFromBytes(bytes).toString();
    const prefix = s.slice(0, s.length - 3);
    return prefix + v4.toString;
  }

  public static override fromBytes(bytes: Byte[]): Option<Ipv6Address> {
    return bytes.length === 16 ? Some(this.unsafeFromBytes(bytes)) : None;
  }

  private static unsafeFromBytes(bytes: Byte[]): Ipv6Address {
    return new Ipv6Address([...bytes]);
  }

  public static override fromString(value: string): Option<Ipv6Address> {
    return this.fromNonMixedString(value)['<|>'](() =>
      this.fromMixedString(value),
    );
  }

  private static fromNonMixedString(value: string): Option<Ipv6Address> {
    const split = (s: string): string[] => {
      const xs = s.split(':');
      // while (xs.length > 0 && xs[0] === '') {
      //   xs.shift();
      // }
      while (xs.length > 0 && xs[xs.length - 1] === '') {
        xs.pop();
      }
      return xs;
    };

    let prefix: List<number> = List.empty;
    let beforeCondenser = true;
    let suffix: List<number> = List.empty;
    const trimmed = value.trim();
    let result: Option<Ipv6Address> | undefined;
    const fields = trimmed.includes(':') ? split(trimmed) : [];
    let idx = 0;
    while (idx < fields.length && result === undefined) {
      const field = fields[idx];
      if (field === '') {
        if (beforeCondenser) {
          beforeCondenser = false;
          if (idx + 1 < fields.length && fields[idx + 1] === '') idx += 1;
        } else {
          result = None;
        }
      } else {
        if (field.length > 4) {
          result = None;
        } else {
          const fieldValueN = parseInt(field, 16);
          if (!Number.isNaN(fieldValueN)) {
            const fieldValue = parseInt(field, 16);
            if (beforeCondenser) prefix = prefix.prepend(fieldValue);
            else suffix = suffix.prepend(fieldValue);
          } else {
            result = None;
          }
        }
      }
      idx += 1;
    }
    if (result != null) {
      return result;
    } else if (
      fields.length === 0 &&
      (trimmed.length === 0 || trimmed !== '::')
    ) {
      return None;
    } else {
      const bytes = new Array<Byte>(16);
      idx = 0;
      const prefixSize = prefix.size;
      let prefixIdx = prefixSize - 1;
      while (prefixIdx >= 0) {
        const value = prefix.get(prefixIdx);
        bytes[idx] = (value >> 8) as Byte;
        bytes[idx + 1] = value as Byte;
        prefixIdx -= 1;
        idx += 2;
      }
      const suffixSize = suffix.size;
      const numCondensedZeroes = bytes.length - idx - suffixSize * 2;
      idx += numCondensedZeroes;
      let suffixIdx = suffixSize - 1;
      while (suffixIdx >= 0) {
        const value = suffix.get(suffixIdx);
        bytes[idx] = (value >> 8) as Byte;
        bytes[idx + 1] = value as Byte;
        suffixIdx -= 1;
        idx += 2;
      }
      return Some(this.unsafeFromBytes(bytes));
    }
  }

  private static fromMixedString(value: string): Option<Ipv6Address> {
    const r = value.match(MixedStringFormat);
    if (r == null) return None;
    const prefix = r[1];
    const v4Str = r[2];

    return Monad.Do(Option.Monad)(function* (_) {
      const pfx = yield* _(Ipv6Address.fromNonMixedString(prefix + '0:0'));
      const v4 = yield* _(Ipv4Address.fromString(v4Str));
      const bytes = pfx.toBytes();
      const v4bytes = v4.toBytes();
      bytes[12] = v4bytes[0];
      bytes[13] = v4bytes[1];
      bytes[14] = v4bytes[2];
      bytes[15] = v4bytes[3];
      return Ipv6Address.unsafeFromBytes(bytes);
    });
  }
}

const MixedStringFormat = /([:a-fA-F0-9]+:)(\d+\.\d+\.\d+\.\d+)/;
