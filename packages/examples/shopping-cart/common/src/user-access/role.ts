// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Schema, TypeOf } from '@fp4ts/schema';

const Role_ = Schema.literal('customer', 'merchant', 'admin');

export type Role = TypeOf<typeof Role_>;
export const Role = function () {};

Role.schema = Role_;
