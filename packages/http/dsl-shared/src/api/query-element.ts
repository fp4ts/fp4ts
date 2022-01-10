import { Type } from '../type';
import { booleanType, numberType, stringType } from '../types';
import { ElementTag } from './api-element';
import { BaseElement } from './base-element';

export const QueryTag = '@fp4ts/http/dsl-shared/query';
export type QueryTag = typeof QueryTag;

export class QueryElement<
  P extends string,
  T extends Type<any, any>,
> extends BaseElement<QueryTag> {
  public readonly [ElementTag] = QueryTag;
  public constructor(public readonly property: P, public readonly type: T) {
    super();
  }
}

export const Query = Object.freeze({
  boolean: <P extends string>(prop: P): QueryElement<P, booleanType> =>
    new QueryElement(prop, booleanType),
  number: <P extends string>(prop: P): QueryElement<P, numberType> =>
    new QueryElement(prop, numberType),
  string: <P extends string>(prop: P): QueryElement<P, stringType> =>
    new QueryElement(prop, stringType),
});
