import { ok as assert } from 'assert';
import { Seq } from '../seq';

export abstract class Chain<A> {
  readonly __void!: void;
}

export const Empty = new (class Empty extends Chain<never> {
  public readonly tag = 'empty';
})();
export type Empty = typeof Empty;

export class Singleton<A> extends Chain<A> {
  public readonly tag = 'singleton';
  public constructor(public readonly value: A) {
    super();
  }
}

export class Concat<A> extends Chain<A> {
  public readonly tag = 'concat';
  public constructor(
    public readonly lhs: NonEmpty<A>,
    public readonly rhs: NonEmpty<A>,
  ) {
    super();
  }
}

export class Wrap<A> extends Chain<A> {
  public readonly tag = 'wrap';
  public constructor(public readonly values: Seq<A>) {
    super();
    assert(values.size > 0, 'Wrap cannot wrap an empty vector');
  }
}

export type NonEmpty<A> = Singleton<A> | Concat<A> | Wrap<A>;
export type View<A> = Empty | NonEmpty<A>;

export const view = <A>(_: Chain<A>): View<A> => _ as any;
