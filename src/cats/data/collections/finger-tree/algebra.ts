// https://andrew.gibiansky.com/blog/haskell/finger-trees/
export abstract class FingerTree<V, A> {
  private readonly __void!: void;
}

export class Empty<V> extends FingerTree<V, never> {
  public readonly tag = 'empty';
}

export class Single<V, A> extends FingerTree<V, A> {
  public readonly tag = 'single';
  public constructor(public readonly value: A) {
    super();
  }
}

export class Deep<V, A> extends FingerTree<V, A> {
  public readonly tag = 'deep';
  public constructor(
    public readonly annotation: V,
    public readonly prefix: Affix<A>,
    public readonly deep: FingerTree<V, Node<V, A>>,
    public readonly suffix: Affix<A>,
  ) {
    super();
  }
}

export type View<V, A> = Empty<V> | Single<V, A> | Deep<V, A>;
export const view = <V, A>(_: FingerTree<V, A>): View<V, A> => _ as any;

export type Node<V, A> = [V, A, A] | [V, A, A, A];

export type Affix<A> = [A] | [A, A] | [A, A, A] | [A, A, A, A];
