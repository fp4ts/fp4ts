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

export class VerbElement<
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

export const Verb =
  <M extends Method>(m: M, s: Status) =>
  <CT extends ContentTypeWithMime<any>, A extends Type<any, any>>(
    ct: CT,
    b: A,
  ): VerbElement<M, CT, A> =>
    new VerbElement(m, s, ct, b);

export const Get = Verb(Method.GET, Status.Ok);
export const Post = Verb(Method.POST, Status.Ok);
export const Put = Verb(Method.PUT, Status.Ok);
export const Delete = Verb(Method.DELETE, Status.Ok);

export const PostCreated = Verb(Method.POST, Status.Created);
export const PutCreated = Verb(Method.PUT, Status.Created);

export const VerbNoContentTag = '@fp4ts/http/dsl-shared/verb-no-content';
export type VerbNoContentTag = typeof VerbNoContentTag;

export class VerbNoContentElement<M extends Method>
  implements ApiElement<VerbNoContentTag>
{
  public readonly [ElementTag] = VerbNoContentTag;
  public constructor(public readonly method: M) {}
}

export const VerbNoContent = <M extends Method>(
  m: M,
): VerbNoContentElement<M> => new VerbNoContentElement(m);
export const GetNoContent = VerbNoContent(Method.GET);
export const PostNoContent = VerbNoContent(Method.POST);
export const PutNoContent = VerbNoContent(Method.PUT);
export const PatchNoContent = VerbNoContent(Method.PATCH);
export const DeleteNoContent = VerbNoContent(Method.DELETE);
