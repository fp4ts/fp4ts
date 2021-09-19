import { FingerTree } from '../finger-tree';

export class Vector<A> {
  private readonly __void!: void;

  public constructor(public readonly _root: FingerTree<Size, A>) {}
}

export type Size = number;
