import { AnyK } from '@cats4ts/core';
import { Pull } from '../pull';

export class Stream<F extends AnyK, A> {
  readonly __void!: void;

  public constructor(public readonly _underlying: Pull<F, A, void>) {}
}
