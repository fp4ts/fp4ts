// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  Capture,
  group,
  JSON,
  Post,
  Put,
  ReqBody,
  Route,
} from '@fp4ts/http-dsl';
import { Brand, BrandId } from '../../../domain/inventory/brand';
import { CreateBrandDto } from './dto';

export const BrandApi = group(
  ReqBody(JSON, CreateBrandDto.Ref)[':>'](Post(JSON, Brand.Ref)),
  Route('enable')
    [':>'](Capture('brand_id', BrandId.Ref))
    [':>'](Put(JSON, Brand.Ref)),
  Route('disable')
    [':>'](Capture('brand_id', BrandId.Ref))
    [':>'](Put(JSON, Brand.Ref)),
);
