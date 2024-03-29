// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

export class AddHeader<H, A> {
  private readonly __void!: void;
  public constructor(public readonly header: H, public readonly body: A) {}
}
