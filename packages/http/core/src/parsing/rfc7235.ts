// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Either, Left, List, Right } from '@fp4ts/cats';
import { Char } from '@fp4ts/core';
import { Accumulator, Parser, StringSource, Rfc5234, text } from '@fp4ts/parse';
import { AuthParams, Credentials, Token } from '../credentials';
import * as Rfc7230 from './rfc7230';

export const t68Chars: Parser<StringSource, Char> = text
  .oneOf('-._~+/')
  .orElse(() => Rfc5234.digit())
  .orElse(() => Rfc5234.alpha());

export const token68: Parser<StringSource, string> = t68Chars
  .repAs1(Accumulator.string())
  .product(text.oneOf('=').repAs(Accumulator.string()))
  .map(([xs, ys]) => xs + ys);

export const scheme: Parser<StringSource, string> = Rfc7230.token;

export const authParamValue: Parser<StringSource, string> =
  Rfc7230.token.orElse(() => Rfc7230.quotedString);

export const authParam: Parser<StringSource, [string, string]> = Rfc7230.token
  .productL(text.char('=' as Char).surroundedBy(Rfc7230.bws))
  .product(authParamValue);

export const credentials: Parser<StringSource, Credentials> = scheme['<*'](
  Rfc5234.sp(),
)
  .product(
    Rfc7230.headerRep1(authParam.backtrack())
      .map<Either<string, List<[string, string]>>>(Right)
      .orElse(() => token68.map(Left)),
  )
  .map(([scheme, ea]) =>
    ea.fold(
      token => new Token(scheme, token),
      params => new AuthParams(scheme, params),
    ),
  );
