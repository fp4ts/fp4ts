// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  booleanType,
  numberType,
  stringType,
  PlainText,
  JSON,
  FromHttpApiDataTag,
} from '@fp4ts/http-dsl-shared';

import { fromHttpApiData, json, plainText } from './builtins';

export const builtins = Object.freeze({
  [FromHttpApiDataTag]: {
    [booleanType.ref]: fromHttpApiData.boolean,
    [numberType.ref]: fromHttpApiData.number,
    [stringType.ref]: fromHttpApiData.string,
  },
  [PlainText.mime]: {
    [booleanType.ref]: plainText.boolean,
    [numberType.ref]: plainText.number,
    [stringType.ref]: plainText.string,
  },
  [JSON.mime]: {
    [booleanType.ref]: json.boolean,
    [numberType.ref]: json.number,
    [stringType.ref]: json.string,
  },
});
export type builtins = typeof builtins;
