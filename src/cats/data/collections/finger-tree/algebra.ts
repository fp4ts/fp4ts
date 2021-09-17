import { ok as assert } from 'assert';

// https://andrew.gibiansky.com/blog/haskell/finger-trees/
export abstract class FingerTree<V, A> {
  private readonly __void!: void;
}

export const Empty = new (class Empty extends FingerTree<any, never> {
  public readonly tag = 'empty';
})();
export type Empty = typeof Empty;

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
    assert(
      prefix.length > 0 && prefix.length < 5,
      'Affix size has to be between 1 and 4',
    );
  }
}

export type View<V, A> = Empty | Single<V, A> | Deep<V, A>;
export const view = <V, A>(_: FingerTree<V, A>): View<V, A> => _ as any;

export type Node<V, A> = [V, A, A] | [V, A, A, A];

export type Affix<A> = [A] | [A, A] | [A, A, A] | [A, A, A, A];
