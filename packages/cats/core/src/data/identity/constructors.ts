// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { id } from '@fp4ts/core';
import { Identity } from './identity';

export const pure: <A>(a: A) => Identity<A> = id;
export const unit: Identity<void> = undefined;
