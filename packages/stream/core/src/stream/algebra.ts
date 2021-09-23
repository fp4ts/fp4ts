import { AnyK } from '@cats4ts/core';
import { Pull } from '../pull';

export class Stream<F extends AnyK, A> {
  private readonly __void!: void;

  private readonly _F!: (_: F) => F;
  private readonly _A!: () => A;

  public constructor(public readonly pull: Pull<F, A, void>) {}
}
