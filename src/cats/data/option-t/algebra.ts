import { Option } from '../option';
import { AnyK, Kind } from '../../../core';

export class OptionT<F extends AnyK, A> {
  private readonly __void!: void;

  public constructor(public readonly value: Kind<F, [Option<A>]>) {}
}
