// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { group, Route } from '@fp4ts/http-dsl';
import { todoApi } from './todo';
import { versionApi } from './version';

export const api = group(
  Route('version')[':>'](versionApi),
  Route('todo')[':>'](todoApi),
);
