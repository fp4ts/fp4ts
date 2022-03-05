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
  Headers,
  Route,
  CaptureAll,

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
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/**
 * @module http/dsl-client
 */
export { toClientIn, toIOClientIn as toClientIOIn } from './internal';
export * from './client-m';
export { TermDerivates, SubDerivates, CodingDerivates } from './type-level';
export { Codable, CodableF } from './codable';
export * from './builtin-codables';
export * from './headers';
