// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import * as C from './constructors';
import * as O from './operators';
import * as Result from './iterator-result';

export const Iter = { ...C, ...O, Result };
