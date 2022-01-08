import { PathElement } from './path-element';

export class Sub<A, B> {
  public constructor(public readonly lhs: A, public readonly rhs: B) {}

  ':>'<S extends string>(that: S): AppendSub<this, PathElement<S>>;
  ':>'<C>(that: C): AppendSub<this, C>;
  ':>'(this: any, that: any): any {
    return typeof that === 'string'
      ? new Sub(this.lhs, this.rhs[':>'](new PathElement(that)))
      : new Sub(this.lhs, this.rhs[':>'](that));
  }
}

// prettier-ignore
type AppendSub<xs, ys> =
  xs extends Sub<infer a, infer b>
    ? Sub<a, AppendSub<b, ys>>
    : Sub<xs, ys>;
