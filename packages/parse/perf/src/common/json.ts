// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Char, EvalF } from '@fp4ts/core';
import { StringSource } from '@fp4ts/parse-core';
import { ParserT } from '@fp4ts/parse-core/lib/parser-t';
import { text } from '@fp4ts/parse-text';

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

export const jsonP: ParserT<StringSource, EvalF, Json> = ParserT.defer<
  StringSource,
  EvalF,
  Json
>(() =>
  nullP
    .orElse(boolP)
    .orElse(numberP)
    .orElse(stringP)
    .orElse(arrayP)
    .orElse(objectP),
);

const nullP = text.string('null').map<Json>(() => null);
const boolP = text
  .string('true')
  .orElse(text.string('false'))
  .map<Json>(Boolean);

const numberP = text.regex(/^-?\d+(\.(\d+)?)?(e[-+]?\d+)?/).map<Json>(Number);
const rawStringP = text
  .regex(/^"(?:[^"\\]|\\.)*"/)
  .map(s => s.slice(1, s.length - 1))
  // strip leading  ^      ^ and trailing quote
  .map(s => s.replace(/\\"/g, '"'))
  //                     ^ unescape "
  .map(s => s.replace(/\\\\/g, '\\'));
//                     ^ unescape \

const stringP = rawStringP;

const sep = text.char(',' as Char).surroundedBy(text.spaces());
const arrayP = jsonP
  .sepBy(sep)
  .surroundedBy(text.spaces())
  .between(text.char('[' as Char), text.char(']' as Char))
  .map(xs => xs.toArray);

const kv: ParserT<StringSource, EvalF, [string, Json]> = rawStringP
  .productL(text.char(':' as Char).surroundedBy(text.spaces()))
  .product(jsonP);
const objectP: ParserT<StringSource, EvalF, Json> = kv
  .sepBy(sep)
  .surroundedBy(text.spaces())
  .between(text.char('{' as Char), text.char('}' as Char))
  .map(xs =>
    xs.foldLeft({} as Record<string, Json>, (xs, [k, v]) => ({
      ...xs,
      [k]: v,
    })),
  );
// const objectP: ParserT<StringSource, EvalF, Json> = kv
//   .sepByAs(sep, {} as Record<string, Json>, ([k, v], xs) => ({ ...xs, [k]: v }))
//   .surroundedBy(text.spaces())
//   .between(text.char('{' as Char), text.char('}' as Char));
