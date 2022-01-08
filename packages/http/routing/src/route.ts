// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { List } from '@fp4ts/cats';
import { Method } from '@fp4ts/http-core';
import { PathComponent } from './path-component';
import { Handler } from './handler';

export class Route<F> {
  public constructor(
    public readonly method: Method,
    public readonly path: List<PathComponent>,
    public readonly handler: Handler<F>,
  ) {}

  public withComponent(c: PathComponent): Route<F> {
    return new Route(this.method, this.path.cons(c), this.handler);
  }
}
