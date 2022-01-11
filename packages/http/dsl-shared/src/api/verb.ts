// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Method, Status } from '@fp4ts/http-core';
import { ContentTypeWithMime } from './content-types';
import { Type } from '../type';
import { ApiElement, ElementTag } from './api-element';

export const VerbTag = '@fp4ts/http/dsl-shared/verb';
export type VerbTag = typeof VerbTag;

export class Verb<
  M extends Method,
  CT extends ContentTypeWithMime<any>,
  A extends Type<any, any>,
> implements ApiElement<VerbTag>
{
  public readonly [ElementTag]: VerbTag;

  public constructor(
    public readonly method: M,
    public readonly status: Status,
    public readonly contentType: CT,
    public readonly body: A,
  ) {}
}

const makeVerb =
  <M extends Method>(m: M, s: Status) =>
  <CT extends ContentTypeWithMime<any>, A extends Type<any, any>>(
    ct: CT,
    b: A,
  ): Verb<M, CT, A> =>
    new Verb(m, s, ct, b);

export const Get = makeVerb(Method.GET, Status.Ok);
export const Post = makeVerb(Method.POST, Status.Ok);
export const Put = makeVerb(Method.PUT, Status.Ok);
export const Delete = makeVerb(Method.DELETE, Status.Ok);

export const PostCreated = makeVerb(Method.POST, Status.Created);
export const PutCreated = makeVerb(Method.PUT, Status.Created);

export const VerbNoContentTag = '@fp4ts/http/dsl-shared/verb-no-content';
export type VerbNoContentTag = typeof VerbNoContentTag;

export class VerbNoContent<M extends Method>
  implements ApiElement<VerbNoContentTag>
{
  public readonly [ElementTag] = VerbNoContentTag;
  public constructor(public readonly method: M) {}
}

export const GetNoContent = new VerbNoContent(Method.GET);
export const PostNoContent = new VerbNoContent(Method.POST);
export const PutNoContent = new VerbNoContent(Method.PUT);
export const PatchNoContent = new VerbNoContent(Method.PATCH);
export const DeleteNoContent = new VerbNoContent(Method.DELETE);
