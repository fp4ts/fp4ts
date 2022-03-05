// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

export class ResponseHeaders<H extends unknown[], A> {
  private readonly __void!: void;
  public constructor(public readonly headers: H, public readonly body: A) {}
}
