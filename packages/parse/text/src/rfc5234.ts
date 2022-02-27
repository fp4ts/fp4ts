// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Char } from '@fp4ts/core';
import { ParserT } from '@fp4ts/parse-core';
import { HasTokenType } from '@fp4ts/parse-kernel';
import * as text from './parsers';

/**
 * Parsers for the common rules of RFC5234. These rules are referenced by several RFCs.
 * @see https://datatracker.ietf.org/doc/html/rfc5234
 */

// A-Z / a-z
export const alpha = <S extends HasTokenType<Char>, F>(): ParserT<S, F, Char> =>
  text
    .oneOf<S, F>(charRange(0x41, 0x5a))
    .orElse(() => text.oneOf(charRange(0x61, 0x7a)));

// "0" / "1"
export const bit = <S extends HasTokenType<Char>, F>(): ParserT<S, F, Char> =>
  text.oneOf('01');

// any 7-bit US-ASCII character, excluding NUL
export const char = <S extends HasTokenType<Char>, F>(): ParserT<S, F, Char> =>
  text.oneOf<S, F>(charRange(0x01, 0x7f));

// carriage return
export const cr = <S extends HasTokenType<Char>, F>(): ParserT<S, F, void> =>
  text.char<S, F>('\r' as Char).void;

// line feed
export const lf = <S extends HasTokenType<Char>, F>(): ParserT<S, F, void> =>
  text.char<S, F>('\n' as Char).void;

// standard internet line newline
export const crlf = <S extends HasTokenType<Char>, F>(): ParserT<S, F, void> =>
  text.stringF<S, F>('\r\n').void;

// controls
export const ctl = <S extends HasTokenType<Char>, F>(): ParserT<S, F, Char> =>
  text.oneOf(`${charRange(0x00, 0x1f)}${String.fromCharCode(0x7f)}`);

export const digit = <S extends HasTokenType<Char>, F>(): ParserT<S, F, Char> =>
  text.digit();

export const dquote = <S extends HasTokenType<Char>, F>(): ParserT<
  S,
  F,
  void
> => text.char<S, F>('"' as Char).void;

export const hexdigit = <S extends HasTokenType<Char>, F>(): ParserT<
  S,
  F,
  Char
> => digit().orElse(() => text.oneOf('ABCDEFabcdef'));

export const htab = <S extends HasTokenType<Char>, F>(): ParserT<S, F, void> =>
  text.char<S, F>('\t' as Char).void;

export const sp = <S extends HasTokenType<Char>, F>(): ParserT<S, F, void> =>
  text.char<S, F>(' ' as Char).void;

export const wsp = <S extends HasTokenType<Char>, F>(): ParserT<S, F, void> =>
  sp().orElse(() => htab());

export const lwsp = <S extends HasTokenType<Char>, F>(): ParserT<S, F, void> =>
  wsp().orElse(() => crlf()['*>'](wsp())).void;

// 8 bits of data
export const octet = <S extends HasTokenType<Char>, F>(): ParserT<S, F, Char> =>
  text.oneOf(charRange(0x00, 0xff));

// visible (printing) characters
export const vchar = <S extends HasTokenType<Char>, F>(): ParserT<S, F, Char> =>
  text.oneOf(charRange(0x21, 0x7e));

const charRange = (from: number, to: number): string =>
  [...new Array(to - from + 1).keys()]
    .map(i => String.fromCharCode(from + i))
    .join('');
