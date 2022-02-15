// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { FunctionK, None, Option, Some } from '@fp4ts/cats';
import { PureF } from '@fp4ts/stream';
import { EntityBody } from './entity-body';

export class Entity<F> {
  public static empty<F = PureF>(): Entity<F> {
    return new Entity(EntityBody.empty(), Some(0));
  }

  public constructor(
    public readonly body: EntityBody<F>,
    public readonly length: Option<number> = None,
  ) {}

  public concat<F2>(this: Entity<F2>, that: Entity<F2>): Entity<F2> {
    const length = this.length.fold(
      () => that.length,
      l1 =>
        that.length.fold(
          () => this.length,
          l2 => Some(l1 + l2),
        ),
    );
    return new Entity(this.body['+++'](that.body), length);
  }
  public '+++'<F2>(this: Entity<F2>, that: Entity<F2>): Entity<F2> {
    return this.concat(that);
  }

  public mapK<G>(nt: FunctionK<F, G>): Entity<G> {
    return new Entity<G>(this.body.mapK(nt), this.length);
  }
}
