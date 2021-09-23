import { FingerTree } from '../finger-tree';

export class Vector<A> {
  private readonly __void!: void;

  private readonly _A!: () => A;

  public constructor(public readonly _root: FingerTree<Size, A>) {}
}

export type Size = number;
