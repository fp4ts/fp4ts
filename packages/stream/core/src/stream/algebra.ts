// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Pull } from '../pull';

export class Stream<F, A> {
  private readonly __void!: void;

  public constructor(public readonly pull: Pull<F, A, void>) {}
}
