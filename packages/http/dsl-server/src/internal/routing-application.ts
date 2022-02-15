// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $ } from '@fp4ts/core';
import { Http } from '@fp4ts/http-core';
import { RouteResultTF } from './route-result';

export type RoutingApplication<F> = Http<$<RouteResultTF, [F]>, F>;
