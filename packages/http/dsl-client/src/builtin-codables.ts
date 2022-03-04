// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { booleanType, numberType, stringType } from '@fp4ts/core';
import {
  PlainText,
  JSON,
  FromHttpApiDataTag,
  ToHttpApiDataTag,
} from '@fp4ts/http-dsl-shared';

import { fromHttpApiData, json, plainText, toHttpApiData } from './builtins';

export const builtins = Object.freeze({
  [FromHttpApiDataTag]: {
    [booleanType.Ref]: fromHttpApiData.boolean,
    [numberType.Ref]: fromHttpApiData.number,
    [stringType.Ref]: fromHttpApiData.string,
  },
  [ToHttpApiDataTag]: {
    [booleanType.Ref]: toHttpApiData.boolean,
    [numberType.Ref]: toHttpApiData.number,
    [stringType.Ref]: toHttpApiData.string,
  },
  [PlainText.mime]: {
    [booleanType.Ref]: plainText.boolean,
    [numberType.Ref]: plainText.number,
    [stringType.Ref]: plainText.string,
  },
  [JSON.mime]: {
    [booleanType.Ref]: json.boolean,
    [numberType.Ref]: json.number,
    [stringType.Ref]: json.string,
  },
});
export type builtins = typeof builtins;
