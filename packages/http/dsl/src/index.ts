// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/**
 * @module http/dsl
 */
// prettier-ignore
export {
  group,

  ReqBody,
  Capture,
  Query,
  Header,
  Route,

  Get,
  Post,
  Put,
  Delete,

  PostCreated,
  PutCreated,

  GetNoContent,
  PostNoContent,
  PutNoContent,
  PatchNoContent,
  DeleteNoContent,

  JSON,
  PlainText,
  
  typeDef,
  booleanType,
  numberType,
  stringType,
  nullType,
  Type,
} from '@fp4ts/http-dsl-shared';
