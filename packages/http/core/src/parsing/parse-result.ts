// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Either, Left, Right } from '@fp4ts/cats';
import { Parser, StringSource } from '@fp4ts/parse';
import { ParsingFailure } from '../messages/message-failure';

export type ParseResult<A> = Either<ParsingFailure, A>;

export const ParseResult = Object.freeze({
  success: <A>(a: A): ParseResult<A> => Right(a),

  fail: <A = never>(sanitized: string, details: string): ParseResult<A> =>
    Left(new ParsingFailure(sanitized, details)),

  fromParser:
    <A>(p: Parser<StringSource, A>, errMsg: string) =>
    (src: string): ParseResult<A> =>
      p
        .complete()
        .parse(src)
        .leftMap(e => new ParsingFailure(errMsg, e.toString())),
});
