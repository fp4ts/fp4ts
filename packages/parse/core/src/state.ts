// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { SourcePosition } from './source-position';

export interface State<S> {
  readonly input: S;
  readonly position: SourcePosition;
}
