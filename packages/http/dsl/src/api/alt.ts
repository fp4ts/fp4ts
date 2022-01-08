export class Alt<A, B> {
  public constructor(public readonly lhs: A, public readonly rhs: B) {}

  '<|>'<C>(that: C): Alt<A, Alt<B, C>>;
  '<|>'(that: any): any {
    return new Alt(this.lhs, new Alt(this.rhs, that));
  }
}

export const group = <xs extends unknown[], x>(
  ...xs: [...xs, x]
): FromList<xs, x> =>
  xs.reduceRight((a, x) => new Alt(x, a)) as FromList<xs, x>;

type FromList<xs extends unknown[], a> = xs extends [...infer ys, infer x]
  ? FromList<ys, Alt<x, a>>
  : a;
