// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { FingerTree } from '../finger-tree';

export class Vector<A> {
  readonly __void!: void;

  readonly _A!: () => A;

  public constructor(public readonly _root: FingerTree<Size, A>) {}
}

export type Size = number;
