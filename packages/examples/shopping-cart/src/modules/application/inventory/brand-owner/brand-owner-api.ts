// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { group, JSON, Put, Route } from '@fp4ts/http-dsl';
import { UserBasicAuth } from '../../auth';
import { BrandOwner } from '../../../domain/inventory/brand-owner';

export const BrandOwnerApi = group(
  UserBasicAuth[':>'](Route('/register')[':>'](Put(JSON, BrandOwner.Ref))),
);
