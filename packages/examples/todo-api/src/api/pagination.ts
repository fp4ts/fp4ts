// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Query } from '@fp4ts/http-dsl';

export const pagination = Query.number('limit')[':>'](Query.number('offset'));
