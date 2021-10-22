import { FingerTree } from '../finger-tree';

export class Vector<A> {
  readonly __void!: void;

  readonly _A!: () => A;

  public constructor(public readonly _root: FingerTree<Size, A>) {}
}

export type Size = number;
