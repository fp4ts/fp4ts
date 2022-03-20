// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Get, JSON } from '@fp4ts/http-dsl';
import { Version } from './version-dto';

export const VersionApi = Get(JSON, Version.Ref);
