// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Char, id } from '@fp4ts/core';
import { None, Some } from '@fp4ts/cats';
import {
  Consumed,
  Failure,
  ParseError,
  Parser,
  State,
  StringSource,
  Success,
} from '@fp4ts/parse-core';
import {
  updatePositionByChar,
  updatePositionByString,
} from './source-position';

const alphaRegex = /^[a-zA-Z]/;
const digitRegex = /^[0-9]/;
const alphaNumRegex = /^\w/;
const whitespaceRegex = /^\s/;

export const satisfy = (p: (c: Char) => boolean): Parser<StringSource, Char> =>
  Parser.unconsPrim<StringSource, Char>(
    id,
    (sp, t) => updatePositionByChar(sp, t),
    x => (p(x) ? Some(x) : None),
  );

export const char = (c: Char): Parser<StringSource, Char> =>
  satisfy(x => x === c);

export const anyChar: Parser<StringSource, Char> = satisfy(() => true);

export const letter: Parser<StringSource, Char> = satisfy(x =>
  alphaRegex.test(x),
);
export const digit: Parser<StringSource, Char> = satisfy(x =>
  digitRegex.test(x),
);
export const alphaNum: Parser<StringSource, Char> = satisfy(x =>
  alphaNumRegex.test(x),
);
export const space: Parser<StringSource, Char> = satisfy(x =>
  whitespaceRegex.test(x),
);
export const spaces: Parser<StringSource, void> = space.skipRep();

export const parens = <A>(
  p: Parser<StringSource, A>,
): Parser<StringSource, A> => p.between(char('(' as Char), char(')' as Char));

export const string = (str: string): Parser<StringSource, string> =>
  Parser(s =>
    s.input.source.startsWith(str)
      ? Consumed.Consumed(
          new Success(
            str,
            new State(
              s.input.drop(str.length),
              updatePositionByString(s.position, str),
            ),
            ParseError.empty(s.position),
          ),
        )
      : Consumed.Empty(
          new Failure(new ParseError(s.position, [`Expected '${str}'`])),
        ),
  );
