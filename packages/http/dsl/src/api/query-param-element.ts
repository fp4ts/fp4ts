import { Schema } from '@fp4ts/schema';
import { ElementBase } from './element-base';

export class QueryParamElement<S extends string, A> extends ElementBase {
  public constructor(public readonly name: S, public readonly sa: Schema<A>) {
    super();
  }
}

export const QueryParam = Object.freeze({
  boolean: <S extends string>(name: S): QueryParamElement<S, boolean> =>
    new QueryParamElement(name, Schema.boolean),
  number: <S extends string>(name: S): QueryParamElement<S, number> =>
    new QueryParamElement(name, Schema.number),
  string: <S extends string>(name: S): QueryParamElement<S, string> =>
    new QueryParamElement(name, Schema.string),
});
