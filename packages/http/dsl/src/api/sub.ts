import { PathElement } from './path-element';

export class Sub<A, B> {
  public constructor(public readonly lhs: A, public readonly rhs: B) {}

  ':>'<S extends string>(that: S): Sub<A, Sub<B, PathElement<S>>>;
  ':>'<C>(that: C): Sub<A, Sub<B, C>>;
  ':>'(that: any): any {
    return typeof that === 'string'
      ? new Sub(this.lhs, new Sub(this.rhs, new PathElement(that)))
      : new Sub(this.lhs, new Sub(this.rhs, that));
  }
}
