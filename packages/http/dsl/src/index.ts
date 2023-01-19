// Copyright (c) 2021-2023 Peter Matta
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
  QueryParam,
  Header,
  Headers,
  Route,
  CaptureAll,

  BasicAuth,

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

  Raw,

  JSON,
  PlainText,
} from '@fp4ts/http-dsl-shared';
