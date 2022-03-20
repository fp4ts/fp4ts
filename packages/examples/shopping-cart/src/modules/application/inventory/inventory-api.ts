// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { group, Raw, Route } from '@fp4ts/http-dsl';

import { BrandApi } from './brand';
import { BrandManagementAuth } from './brand-management-auth';

export const InventoryApi = group(
  BrandManagementAuth[':>'](group(Route('/brand')[':>'](BrandApi))),
  Route('/brand-owner')[':>'](Raw),
);
