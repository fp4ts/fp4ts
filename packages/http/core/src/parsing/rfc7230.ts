// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Char } from '@fp4ts/core';
import { Parser, text, Rfc5234, StringSource } from '@fp4ts/parse';
import { charRange } from './char-range';

/**
 * Parsers for the common rules of RFC7230. These rules are referenced by several RFCs.
 * @see https://datatracker.ietf.org/doc/html/rfc7230
 */

export const tchar: Parser<StringSource, Char> = text
  .oneOf("!#$%&'*+-.^_`|~")
  .orElse(() => Rfc5234.digit())
  .orElse(() => Rfc5234.alpha());

export const token: Parser<StringSource, string> = tchar
  .rep1()
  .map(xs => xs.toArray.join(''));

// `obs-text = %x80-FF`
export const obsText: Parser<StringSource, Char> = text.oneOf(
  charRange(0x80, 0xff),
);

// `OWS = *( SP / HTAB )`
export const ows: Parser<StringSource, void> = Rfc5234.sp()
  .orElse(() => Rfc5234.htab())
  .rep().void;

export const bws: Parser<StringSource, void> = ows;

//   qdtext         = HTAB / SP /%x21 / %x23-5B / %x5D-7E / obs-text */
export const qdText: Parser<StringSource, Char> = text
  .oneOf(`\t ${String.fromCharCode(0x21)}`)
  .orElse(() => text.oneOf(charRange(0x23, 0x5b)))
  .orElse(() => text.oneOf(charRange(0x5d, 0x7e)))
  .orElse(() => obsText);

export const qdPairChar: Parser<StringSource, Char> = text
  .oneOf('\t ')
  .orElse(() => Rfc5234.vchar())
  .orElse(() => obsText);

export const quotedPair: Parser<StringSource, Char> = text
  .char('\\' as Char)
  ['*>'](qdPairChar);

// quoted-string  = DQUOTE *( qdtext / quoted-pair ) DQUOTE
export const quotedString: Parser<StringSource, string> = qdText
  .orElse(() => quotedPair)
  .rep()
  .map(xs => xs.toArray.join(''))
  .surroundedBy(Rfc5234.dquote());

// HTAB / SP / %x21-27 / %x2A-5B / %x5D-7E / obs-text
export const cText: Parser<StringSource, Char> = text
  .oneOf(`\t ${String.fromCharCode(0x21)}`)
  .orElse(() => text.oneOf(charRange(0x21, 0x27)))
  .orElse(() => text.oneOf(charRange(0x2a, 0x5b)))
  .orElse(() => text.oneOf(charRange(0x5d, 0x7e)))
  .orElse(() => obsText);

// "(" *( ctext / quoted-pair / comment ) ")"
export const comment: Parser<StringSource, string> = cText
  .orElse(() => quotedPair)
  .orElse(() => comment)
  .between(text.char('(' as Char), text.char(')' as Char));

export const listSep = text.char(',' as Char).surroundedBy(ows);
