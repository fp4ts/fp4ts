// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { List } from '@fp4ts/cats';
import { Handler } from './handler';
import { PathComponent } from './path-component';

export class Route<F> {
  public constructor(
    public readonly path: List<PathComponent>,
    public readonly handler: Handler<F>,
  ) {}
}
