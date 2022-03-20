// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { EitherT, Monad } from '@fp4ts/cats';
import { MessageFailure } from '@fp4ts/http';

import { User } from '../../../domain/auth';
import {
  BrandOwner,
  BrandOwnerService,
} from '../../../domain/inventory/brand-owner';

export class CreateBrandOwnerApiService<F> {
  public constructor(
    private readonly F: Monad<F>,
    private readonly service: BrandOwnerService<F>,
  ) {}

  public createBrandOwner(user: User): EitherT<F, MessageFailure, BrandOwner> {
    return EitherT.liftF(this.F)(this.service.createBrandOwner(user));
  }
}
