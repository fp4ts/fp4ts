// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { EvalF } from '@fp4ts/core';
import { Byte, Char, lazyVal } from '@fp4ts/core';
import { ParserT, StringSource } from '@fp4ts/parse-core';
import { HasTokenType } from '@fp4ts/parse-kernel';
import * as text from './parsers';

/**
 * Parsers for the common rules of RFC5234. These rules are referenced by several RFCs.
 * @see https://datatracker.ietf.org/doc/html/rfc5234
 */

// A-Z / a-z
export const alpha: <S extends HasTokenType<Char>, F>() => ParserT<S, F, Char> =
  lazyVal(
    <S extends HasTokenType<Char>, F>(): ParserT<S, F, Char> =>
      text.oneOf<S, F>(0x41, 0x5a).orElse(text.oneOf(0x61, 0x7a)),
  ) as <S extends HasTokenType<Char>, F>() => ParserT<S, F, Char>;

// "0" / "1"
export const bit: <S extends HasTokenType<Char>, F>() => ParserT<S, F, Char> =
  lazyVal(
    <S extends HasTokenType<Char>, F>(): ParserT<S, F, Char> =>
      text.oneOf('01'),
  ) as <S extends HasTokenType<Char>, F>() => ParserT<S, F, Char>;

// any 7-bit US-ASCII character, excluding NUL
export const char: <S extends HasTokenType<Char>, F>() => ParserT<S, F, Char> =
  lazyVal(
    <S extends HasTokenType<Char>, F>(): ParserT<S, F, Char> =>
      text.oneOf<S, F>(0x01, 0x7f),
  ) as <S extends HasTokenType<Char>, F>() => ParserT<S, F, Char>;

// carriage return
export const cr: <S extends HasTokenType<Char>, F>() => ParserT<S, F, void> =
  lazyVal(
    <S extends HasTokenType<Char>, F>(): ParserT<S, F, void> =>
      text.char<S, F>('\r' as Char).void(),
  ) as <S extends HasTokenType<Char>, F>() => ParserT<S, F, void>;

// line feed
export const lf: <S extends HasTokenType<Char>, F>() => ParserT<S, F, void> =
  lazyVal(
    <S extends HasTokenType<Char>, F>(): ParserT<S, F, void> =>
      text.char<S, F>('\n' as Char).void(),
  ) as <S extends HasTokenType<Char>, F>() => ParserT<S, F, void>;

// standard internet line newline
export const crlf = text.string('\r\n').void();
// standard internet line newline
export const crlfF: <S extends HasTokenType<Char>, F>() => ParserT<S, F, void> =
  lazyVal(
    <S extends HasTokenType<Char>, F>(): ParserT<S, F, void> =>
      text.stringF<S, F>('\r\n').void(),
  ) as <S extends HasTokenType<Char>, F>() => ParserT<S, F, void>;

// controls
export const ctl: <S extends HasTokenType<Char>, F>() => ParserT<S, F, Char> =
  lazyVal(
    <S extends HasTokenType<Char>, F>(): ParserT<S, F, Char> =>
      text
        .oneOf<S, F>(0x00, 0x1f)
        .orElse(text.char(Char.fromByte(0x7f as Byte))),
  ) as <S extends HasTokenType<Char>, F>() => ParserT<S, F, Char>;

export const digit: <S extends HasTokenType<Char>, F>() => ParserT<S, F, Char> =
  lazyVal(
    <S extends HasTokenType<Char>, F>(): ParserT<S, F, Char> => text.digit(),
  ) as <S extends HasTokenType<Char>, F>() => ParserT<S, F, Char>;

export const dquote: <S extends HasTokenType<Char>, F>() => ParserT<
  S,
  F,
  void
> = lazyVal(
  <S extends HasTokenType<Char>, F>(): ParserT<S, F, void> =>
    text.char<S, F>('"' as Char).void(),
) as <S extends HasTokenType<Char>, F>() => ParserT<S, F, void>;

export const hexdigit: <S extends HasTokenType<Char>, F>() => ParserT<
  S,
  F,
  Char
> = lazyVal(
  <S extends HasTokenType<Char>, F>(): ParserT<S, F, Char> =>
    digit<S, F>().orElse(text.oneOf('ABCDEFabcdef')),
) as <S extends HasTokenType<Char>, F>() => ParserT<S, F, Char>;

const htabChar = '\t' as Char;
export const htab: <S extends HasTokenType<Char>, F>() => ParserT<S, F, void> =
  lazyVal(
    <S extends HasTokenType<Char>, F>(): ParserT<S, F, void> =>
      text.char<S, F>(htabChar).void(),
  ) as <S extends HasTokenType<Char>, F>() => ParserT<S, F, void>;

const spChar = ' ' as Char;
export const sp: <S extends HasTokenType<Char>, F>() => ParserT<S, F, void> =
  lazyVal(
    <S extends HasTokenType<Char>, F>(): ParserT<S, F, void> =>
      text.char<S, F>(spChar).void(),
  ) as <S extends HasTokenType<Char>, F>() => ParserT<S, F, void>;

export const wsp: <S extends HasTokenType<Char>, F>() => ParserT<S, F, void> =
  lazyVal(
    <S extends HasTokenType<Char>, F>(): ParserT<S, F, void> =>
      text.oneOf<S, F>(`${htabChar}${spChar}`).void(),
  ) as <S extends HasTokenType<Char>, F>() => ParserT<S, F, void>;

export const lwsp = wsp<StringSource, EvalF>().orElse(crlf['*>'](wsp())).void();

export const lwspF: <S extends HasTokenType<Char>, F>() => ParserT<S, F, void> =
  lazyVal(
    <S extends HasTokenType<Char>, F>(): ParserT<S, F, void> =>
      wsp<S, F>().orElse(crlfF<S, F>()['*>'](wsp())).void(),
  ) as <S extends HasTokenType<Char>, F>() => ParserT<S, F, void>;

// 8 bits of data
export const octet: <S extends HasTokenType<Char>, F>() => ParserT<S, F, Char> =
  lazyVal(
    <S extends HasTokenType<Char>, F>(): ParserT<S, F, Char> =>
      text.oneOf(0x00, 0xff),
  ) as <S extends HasTokenType<Char>, F>() => ParserT<S, F, Char>;

// visible (printing) characters
export const vchar: <S extends HasTokenType<Char>, F>() => ParserT<S, F, Char> =
  lazyVal(
    <S extends HasTokenType<Char>, F>(): ParserT<S, F, Char> =>
      text.oneOf(0x21, 0x7e),
  ) as <S extends HasTokenType<Char>, F>() => ParserT<S, F, Char>;
