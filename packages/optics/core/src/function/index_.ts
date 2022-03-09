// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Optional } from '../optional';

export class Index<S, I, A> {
  public constructor(public readonly index: (i: I) => Optional<S, A>) {}
}
