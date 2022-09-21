// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Byte, Char, snd } from '@fp4ts/core';
import {
  Status,
  QValue,
  MediaType,
  MediaRange,
  Accept,
  AccessControlAllowMethod,
  MediaRangeAndQValue,
  ContentType,
  Method,
  Challenge,
  AuthScheme,
  Token,
  AuthParams,
  BasicCredentials,
  Credentials,
  Authorization,
} from '@fp4ts/http-core';
import { List, Map, Ord } from '@fp4ts/cats';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

export * from '@fp4ts/stream-test-kit/lib/arbitraries';

export const fp4tsValidStatusCode = (): Arbitrary<number> =>
  fc.integer({ min: Status.MinCode, max: Status.MaxCode });

export const fp4tsStatus = (): Arbitrary<Status> =>
  fp4tsValidStatusCode().map(code => Status.unsafeFromCode(code));

export const fp4tsMethod = (): Arbitrary<Method> =>
  fc.constantFrom(...Method.all);

const arbChar = fc
  .integer({ min: 0x00, max: 0x07f })
  .map(x => Char.fromByte(x as Byte));
const ctlChar = [
  Char.fromByte(0x07f as Byte),
  ...[...new Array(0x1f).keys()].map(x => Char.fromByte(x as Byte)),
];
const arbCtlChar = fc.constantFrom(...ctlChar);

const lws = [' ', '\t'];

const arbCrLf = fc.constant('\r\n');

const arbRightLws = fc
  .array(fc.constantFrom(...lws), { minLength: 1 })
  .map(xs => xs.join(''));
const arbLws = fc.oneof(
  fc.array(fc.oneof(arbCrLf, arbRightLws)).map(x => x.join('')),
  arbRightLws,
);

const octets = [...new Array(0xff).keys()].map(x => Char.fromByte(x as Byte));
const arbOctet = fc.constantFrom(...octets);

const allowedText = octets.filter(x => !ctlChar.includes(x));

const arbText = fc.oneof(
  fc
    .array(fc.constantFrom(...allowedText), { minLength: 1 })
    .map(x => x.join('')),
  arbLws,
);

const allowedQDText = allowedText.filter(c => c !== '"' && c !== '\\');
const arbQDText = fc
  .array(fc.constantFrom(...allowedQDText), { minLength: 1 })
  .map(xs => xs.join(''));
// prettier-ignore
const tchars = [
  '!', '#', '$', '%', '&', "'", '*', '+', '-', '.', '^', '_', '`', '|', '~',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
];
const arbTchar = fc.constantFrom(...tchars);
const arbToken = fc.array(arbTchar, { minLength: 1 }).map(xs => xs.join(''));

const vToken = [...new Array(0x07e - 0x021 + 1).keys()].map(x =>
  Char.fromByte((x + 0x21) as Byte),
);
const arbVToken = fc.constantFrom(...vToken);
const arbFieldVchar = arbVToken;

export const fp4tsQValue = (): Arbitrary<QValue> =>
  fc
    .oneof(fc.constantFrom(0, 1000), fc.integer({ min: 0, max: 1000 }))
    .map(xs => QValue.fromThousands(xs).get);

const allowedQuotedText = allowedText.map(c =>
  c === '"' ? ('\\"' as Char) : c === '\\' ? c === ('\\\\' as Char) : c,
);
const arbQuotedText = fc
  .array(fc.constantFrom(...allowedQuotedText), { minLength: 1 })
  .map(s => `"${s.join('')}"`);

const arbUnquotedText = arbQDText;
const arbMediaRangeExtension = fc.tuple(arbToken, fc.oneof(arbQDText, arbText));

const arbMediaRangeExtensions: Arbitrary<Map<string, string>> = fc
  .array(arbMediaRangeExtension)
  .map(xs => Map.fromArray(Ord.fromUniversalCompare() as Ord<string>)(xs));

export const fp4tsMediaType = (): Arbitrary<MediaType> =>
  fc.constantFrom(...MediaType.all.toArray.map(snd));

export const fp4tsMediaRange = (): Arbitrary<MediaRange> =>
  fc
    .tuple(
      arbToken.map(xs => xs.toLowerCase()),
      arbMediaRangeExtensions,
    )
    .map(([type, extensions]) => new MediaRange(type, extensions));

const arbMediaRangeAndQValue = fc
  .tuple(fp4tsMediaRange(), fp4tsQValue())
  .map(([mr, qv]) => new MediaRangeAndQValue(mr, qv));

export const fp4tsAcceptHeader = (): Arbitrary<Accept> =>
  A.fp4tsNel(arbMediaRangeAndQValue).map(xs => new Accept(xs));

export const fp4tsAccessControlAllowMethodHeader =
  (): Arbitrary<AccessControlAllowMethod> =>
    fp4tsMethod().map(m => new AccessControlAllowMethod(m));

const arbAuthScheme: Arbitrary<AuthScheme> = fc.constantFrom(
  AuthScheme.Basic,
  AuthScheme.Bearer,
  AuthScheme.Digest,
  AuthScheme.OAuth,
);

// const arbT68Char: Arbitrary<Char> = fc
//   .char()
//   .filter(c => /\W-\._+\//.test(c)) as Arbitrary<Char>;
// const arbAuthToken: Arbitrary<Token> = fc
//   .tuple(arbAuthScheme, arbT68Char)
//   .map(([scheme, tok]) => new Token(scheme, tok));
// const arbAuthParam: Arbitrary<[string, string]> = fc.tuple(
//   arbToken,
//   fc.oneof(arbQDText, arbQuotedText),
// );
// const arbAuthParams_: Arbitrary<List<[string, string]>> = fc
//   .array(arbAuthParam, { minLength: 1 })
//   .map(xs => List.fromArray(xs));

// const arbAuthParams: Arbitrary<AuthParams> = fc
//   .tuple(arbAuthScheme, arbAuthParams_)
//   .map(([scheme, params]) => new AuthParams(scheme, params));

// export const fp4tsCredentials = (): Arbitrary<Credentials> =>
//   fc.oneof(arbAuthToken, arbAuthParams);

// export const fp4tsAuthorizationHeader = (): Arbitrary<Authorization> =>
//   fp4tsCredentials().map(creds => new Authorization(creds));

export const fp4tsBasicCredentials = (): Arbitrary<BasicCredentials> =>
  fc
    .tuple(fc.unicodeString(), fc.unicodeString())
    .map(([username, password]) => new BasicCredentials(username, password));

// export const fp4tsCredentials = (): Arbitrary<Credentials> =>
//   fc.oneof(arbAuthParams, arbBasicCredentials);

const arbRealm: Arbitrary<string> = arbToken;
const arbChallengeParam: Arbitrary<[string, string]> = fc
  .tuple(arbToken, fc.oneof(arbQDText, arbText))
  .filter(x => x[0] !== 'realm');
const arbChallengeParams: Arbitrary<Map<string, string>> = fc
  .array(arbChallengeParam)
  .map(xs => Map.fromArray(Ord.fromUniversalCompare() as Ord<string>)(xs));

export const fp4tsChallenge = (): Arbitrary<Challenge> =>
  fc
    .tuple(arbAuthScheme, arbRealm, arbChallengeParams)
    .map(([scheme, realm, params]) => new Challenge(scheme, realm, params));

export const fp4tsContentTypeHeader = (): Arbitrary<ContentType> =>
  fp4tsMediaType().map(mt => new ContentType(mt));
