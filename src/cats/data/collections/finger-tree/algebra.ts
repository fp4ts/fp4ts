// https://andrew.gibiansky.com/blog/haskell/finger-trees/
export abstract class FingerTree<A> {
  private readonly __void!: void;
}

export const Empty = new (class Empty extends FingerTree<never> {
  public readonly tag = 'empty';
})();
export type Empty = typeof Empty;

export class Single<A> extends FingerTree<A> {
  public readonly tag = 'single';
  public constructor(public readonly value: A) {
    super();
  }
}

export class Deep<A> extends FingerTree<A> {
  public readonly tag = 'deep';
  public constructor(
    public readonly prefix: Affix<A>,
    public readonly deep: FingerTree<Node<A>>,
    public readonly suffix: Affix<A>,
  ) {
    super();
  }
}

export type View<A> = Empty | Single<A> | Deep<A>;
export const view = <A>(_: FingerTree<A>): View<A> => _ as any;

export type Node<A> = [A, A] | [A, A, A];

export type Affix<A> = [A] | [A, A] | [A, A, A] | [A, A, A, A];
