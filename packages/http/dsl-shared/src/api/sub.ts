import { ApiElement, ElementTag } from './api-element';
import { StaticElement } from './static-element';

export const SubTag = '@fp4ts/http/dsl-shared/sub';
export type SubTag = typeof SubTag;

export class Sub<A, B> implements ApiElement<SubTag> {
  public readonly [ElementTag] = SubTag;

  public constructor(public readonly lhs: A, public readonly rhs: B) {}

  public ':>'<P extends string>(that: P): Sub<A, Sub<B, StaticElement<P>>>;
  public ':>'<C>(that: C): AppendSub<this, C>;
  public ':>'(this: any, that: any): any {
    return typeof that === 'string'
      ? new Sub(this.lhs, this.rhs[':>'](new StaticElement(that)))
      : new Sub(this.lhs, this.rhs[':>'](that));
  }
}

// prettier-ignore
export type AppendSub<x, y> =
  x extends Sub<infer a, infer b>
    ? Sub<a, AppendSub<b, y>>
    : Sub<x, y>;
