import { AnyK, Kind } from '@cats4ts/core';

import { Option } from '../option';

export class OptionT<F extends AnyK, A> {
  private readonly __void!: void;

  private readonly _A!: () => A;
  private readonly _F!: (_: F) => F;

  public constructor(public readonly value: Kind<F, [Option<A>]>) {}
}
