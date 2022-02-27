// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Char } from '@fp4ts/core';
import { Parser, StringSource } from '@fp4ts/parse-core';
import { text } from '@fp4ts/parse-text';

type Json =
  | { tag: 'null' }
  | { tag: 'boolean'; value: boolean }
  | { tag: 'number'; value: number }
  | { tag: 'string'; value: string }
  | { tag: 'array'; value: Json[] }
  | { tag: 'object'; value: Record<string, Json> };

const JNull: Json = { tag: 'null' };
const JBool = (value: boolean): Json => ({ tag: 'boolean', value });
const JNumber = (value: number): Json => ({ tag: 'number', value });
const JString = (value: string): Json => ({ tag: 'string', value });
const JArray = (value: Json[]): Json => ({ tag: 'array', value });
const JObject = (value: Record<string, Json>): Json => ({
  tag: 'object',
  value,
});

export const jsonP: Parser<StringSource, Json> = Parser.defer(() => nullP)
  ['<|>'](() => boolP)
  ['<|>'](() => numberP)
  ['<|>'](() => stringP)
  ['<|>'](() => arrayP)
  ['<|>'](() => objectP);

const nullP = text.string('null').as(JNull);
const boolP = text
  .string('true')
  ['<|>'](() => text.string('false'))
  .map(Boolean)
  .map(JBool);

const numberP = text
  .regex(/^-?\d+(\.(\d+)?)?(e[-+]?\d+)?/)
  .map(Number)
  .map(JNumber);
const rawStringP = text
  .regex(/^"(?:[^"\\]|\\.)*"/)
  .map(s => s.slice(1, s.length - 1))
  // strip leading  ^      ^ and trailing quote
  .map(s => s.replace(/\\"/g, '"'))
  //                     ^ unescape "
  .map(s => s.replace(/\\\\/g, '\\'));
//                     ^ unescape \

const stringP = rawStringP.map(JString);

const sep = text.char(',' as Char).surroundedBy(text.spaces());
const arrayP = jsonP
  .sepBy(sep)
  .surroundedBy(text.spaces())
  .between(text.char('[' as Char), text.char(']' as Char))
  .map(xs => JArray(xs.toArray));

const kv: Parser<StringSource, [string, Json]> = rawStringP['<*'](
  text.char(':' as Char).surroundedBy(text.spaces()),
).product(jsonP);
const objectP: Parser<StringSource, Json> = kv
  .sepBy(sep)
  .surroundedBy(text.spaces())
  .between(text.char('{' as Char), text.char('}' as Char))
  .map(xs =>
    JObject(
      xs.foldLeft({} as Record<string, Json>, (xs, [k, v]) => ({
        ...xs,
        [k]: v,
      })),
    ),
  );
