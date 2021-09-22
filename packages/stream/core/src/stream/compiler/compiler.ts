import { MonadError } from '@cats4ts/cats-core';
import { AnyK } from '@cats4ts/core';
import { Pull } from '../../pull';

export class Compiler<F extends AnyK, A> {
  private readonly __void!: void;

  public constructor(
    public readonly F: MonadError<F, Error>,
    public readonly _underlying: Pull<F, A, void>,
  ) {}
}
