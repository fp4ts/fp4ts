// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { EvalF } from '@fp4ts/core';
import { None, Some } from '@fp4ts/cats';
import { Char, Kind, throwError } from '@fp4ts/core';
import { Message, ParseError, State, StringSource } from '@fp4ts/parse-core';
import { ParserT } from '@fp4ts/parse-core/lib/parser-t';
import { HasTokenType, TokenType } from '@fp4ts/parse-kernel';
import {
  updatePositionByChar,
  updatePositionByString,
} from './source-position';

const alphaRegex = /^[a-zA-Z]/;
const digitRegex = /^[0-9]/;
const alphaNumRegex = /^\w/;
const whitespaceRegex = /^\s/;

export const satisfy = <S extends HasTokenType<Char> = StringSource, F = EvalF>(
  p: (c: Char) => boolean,
): ParserT<S, F, Char> =>
  ParserT.tokenPrim<S, F, Char>(
    c => `'${c}'`,
    (sp, t) => updatePositionByChar(sp, t),
    x => (p(x) ? Some(x) : None),
  );

/* eslint-disable prettier/prettier */
export function oneOf<S extends HasTokenType<Char> = StringSource, F = EvalF>(lo: number, hi: number): ParserT<S, F, Char>;
export function oneOf<S extends HasTokenType<Char> = StringSource, F = EvalF>(chars: string): ParserT<S, F, Char>;
export function oneOf(lo: any, hi?: any): any {
  return hi === undefined
    ? satisfy(c => lo.includes(c))
    : satisfy(c => { const x = c.charCodeAt(0); return x >= lo && x <= hi });
}
/* eslint-enable prettier/prettier */

/* eslint-disable prettier/prettier */
export function noneOf<S extends HasTokenType<Char> = StringSource, F = EvalF>(lo: number, hi: number): ParserT<S, F, Char>;
export function noneOf<S extends HasTokenType<Char> = StringSource, F = EvalF>(chars: string): ParserT<S, F, Char>;
export function noneOf(lo: any, hi?: any): any {
  return hi === undefined
    ? satisfy(c => !lo.includes(c))
    : satisfy(c => { const x = c.charCodeAt(0); return !(x >= lo && x <= hi) });
}
/* eslint-enable prettier/prettier */

export const char = <S extends HasTokenType<Char> = StringSource, F = EvalF>(
  c: Char,
): ParserT<S, F, Char> => satisfy<S, F>(x => x === c).label(`'${c}'`);

export const anyChar = <
  S extends HasTokenType<Char> = StringSource,
  F = EvalF,
>(): ParserT<S, F, Char> => satisfy(() => true);

export const letter = <
  S extends HasTokenType<Char> = StringSource,
  F = EvalF,
>(): ParserT<S, F, Char> =>
  satisfy<S, F>(x => alphaRegex.test(x)).label('letter');

export const digit = <
  S extends HasTokenType<Char> = StringSource,
  F = EvalF,
>(): ParserT<S, F, Char> =>
  satisfy<S, F>(x => digitRegex.test(x)).label('digit');
export const digits = <
  S extends HasTokenType<Char> = StringSource,
  F = EvalF,
>(): ParserT<S, F, string> =>
  digit<S, F>()
    .repAs('', (x, y) => x + y)
    .label('digits');
export const digits1 = <
  S extends HasTokenType<Char> = StringSource,
  F = EvalF,
>(): ParserT<S, F, string> =>
  digit<S, F>()
    .map2(
      digit<S, F>().repAs('', (x, y) => x + y),
      (a, b) => a + b,
    )
    .label('digits1');

export const alphaNum = <
  S extends HasTokenType<Char> = StringSource,
  F = EvalF,
>(): ParserT<S, F, Char> =>
  satisfy<S, F>(x => alphaNumRegex.test(x)).label('letter or digit');
export const space = <
  S extends HasTokenType<Char> = StringSource,
  F = EvalF,
>(): ParserT<S, F, Char> =>
  satisfy<S, F>(x => whitespaceRegex.test(x)).label('space');
export const spaces = <
  S extends HasTokenType<Char> = StringSource,
  F = EvalF,
>(): ParserT<S, F, void> => space<S, F>().skipRep().label('white space');

export const parens = <
  A,
  S extends HasTokenType<Char> = StringSource,
  F = EvalF,
>(
  p: ParserT<S, F, A>,
): ParserT<S, F, A> => p.between(char('(' as Char), char(')' as Char));

export const string = <F = EvalF>(
  str: string,
): ParserT<StringSource, F, string> =>
  str === ''
    ? ParserT.succeed('') // -- Trivial success
    : ParserT<StringSource, F, string>((S, s, cok, cerr, _eok, eerr) =>
        parseString(str, s, cok, cerr, eerr),
      ).label(str);

export const stringF = <S extends HasTokenType<Char> = StringSource, F = EvalF>(
  str: string,
): ParserT<S, F, string> =>
  ParserT.tokens<S, F>(
    _ => str,
    (pos, _) => updatePositionByString(pos, str),
    str.split('') as TokenType<S>[],
  )
    .as(str)
    .label(str);

function parseString<F, B>(
  str: string,
  s: State<StringSource>,
  cok: (o: string, rem: State<StringSource>, err: ParseError) => Kind<F, [B]>,
  cerr: (err: ParseError) => Kind<F, [B]>,
  eerr: (err: ParseError) => Kind<F, [B]>,
): Kind<F, [B]> {
  const input = s.input;
  const cur = input.cursor;

  for (let i = 0, len = str.length; i < len; i++) {
    const c = input.source.charAt(cur + i - 1);
    if (c === '')
      return i === 0
        ? eerr(ParseError.unexpected(s.position, ''))
        : cerr(ParseError.unexpected(s.position, ''));

    const t = str.charAt(i);
    if (t !== c)
      return i === 0
        ? eerr(ParseError.unexpected(s.position, c))
        : cerr(ParseError.unexpected(s.position, c));
  }

  const position = updatePositionByString(s.position, str);
  return cok(
    str,
    { input: input.drop(str.length), position },
    ParseError.empty(position),
  );
}

/**
 * **WARNING:** as we cannot check for partial prefix match of the regex, this
 * combinator is _always_ backtracking. I.e., can produce either _consumed ok_,
 * or _empty error_.
 */
export const regex = (re: RegExp): ParserT<StringSource, EvalF, string> =>
  !re.source.startsWith('^')
    ? throwError(
        new Error(
          'RegExpError: Parser regular expressions mush start with `^`',
        ),
      )
    : ParserT((S, s, cok, _cerr, eok, eerr) =>
        parseRegex(re, s, cok, eok, eerr),
      );

function parseRegex<F, B>(
  re: RegExp,
  s: State<StringSource>,
  cok: (o: string, rem: State<StringSource>, err: ParseError) => Kind<F, [B]>,
  eok: (o: string, rem: State<StringSource>, err: ParseError) => Kind<F, [B]>,
  eerr: (err: ParseError) => Kind<F, [B]>,
): Kind<F, [B]> {
  const m = s.input.source
    .substring(s.input.cursor - 1, s.input.source.length)
    .match(re);
  const r = m?.[0];
  if (r == null)
    return eerr(
      new ParseError(s.position, [Message.Expected(`Re(${re.source})`)]),
    );

  const position = updatePositionByString(s.position, r);
  return r === ''
    ? eok('', s, ParseError.empty(s.position))
    : cok(
        r,
        { input: s.input.drop(r.length), position: position },
        ParseError.empty(position),
      );
}
