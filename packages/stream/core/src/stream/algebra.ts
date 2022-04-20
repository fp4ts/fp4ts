// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Pull } from '../pull';

export class Stream<F, A> {
  private readonly __void!: void;

  private readonly _F!: () => F;
  private readonly _A!: () => A;

  public constructor(public readonly pull: Pull<F, A, void>) {}
}
