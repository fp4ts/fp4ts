import { Method } from '@fp4ts/http-core';
import { ApiElement, ElementTag } from './api-element';

export const VerbTag = '@fp4ts/http/dsl-shared/verb';
export type VerbTag = typeof VerbTag;

export class Verb<M extends Method> implements ApiElement<VerbTag> {
  public readonly [ElementTag] = VerbTag;
  public constructor(public readonly method: M) {}
}

export const Get = new Verb(Method.GET);
export const Post = new Verb(Method.POST);
export const Put = new Verb(Method.PUT);
export const Delete = new Verb(Method.DELETE);
