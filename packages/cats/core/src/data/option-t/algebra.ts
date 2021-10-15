import { Kind } from '@cats4ts/core';

import { Option } from '../option';

export class OptionT<F, A> {
  private readonly __void!: void;

  public constructor(public readonly value: Kind<F, [Option<A>]>) {}
}
