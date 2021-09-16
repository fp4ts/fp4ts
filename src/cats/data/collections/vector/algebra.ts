// https://andrew.gibiansky.com/blog/haskell/finger-trees/
export abstract class Vector<A> {
  private readonly __void!: void;
}

export const Empty = new (class Empty extends Vector<never> {
  public readonly tag = 'empty';
})();
export type Empty = typeof Empty;

export class Single<A> extends Vector<A> {
  public readonly tag = 'single';
  public constructor(public readonly value: A) {
    super();
  }
}

export class Deep<A> extends Vector<A> {
  public readonly tag = 'deep';
  public constructor(
    public readonly prefix: Affix<A>,
    public readonly deep: Vector<Node<A>>,
    public readonly suffix: Affix<A>,
  ) {
    super();
  }
}

export type FingerTree<A> = Empty | Single<A> | Deep<A>;
export const toTree = <A>(_: Vector<A>): FingerTree<A> => _ as any;

export type Node<A> = [A, A] | [A, A, A];

export type Affix<A> = [A] | [A, A] | [A, A, A] | [A, A, A, A];
