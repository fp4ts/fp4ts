// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Map } from '@fp4ts/cats';

export class Challenge {
  public constructor(
    public readonly scheme: string,
    public readonly realm: string,
    public readonly params: Map<string, string> = Map.empty,
  ) {}

  public toString(): string {
    const params = this.params.toArray.map(([k, v]) => `${k}="${v}"`);
    return [`${this.scheme} realm="${this.realm}"`, ...params].join(', ');
  }
}
