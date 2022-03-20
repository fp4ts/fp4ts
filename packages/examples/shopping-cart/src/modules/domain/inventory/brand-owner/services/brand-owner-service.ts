// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Monad } from '@fp4ts/cats';
import { Kind } from '@fp4ts/core';

import { User, UserId } from '../../../auth';
import { BrandOwner } from '../brand-owner';
import { BrandOwnerRepository } from '../repositories';
import { BrandOwnerId } from '../values';

export class BrandOwnerService<F> {
  public constructor(
    private readonly F: Monad<F>,
    private readonly repo: BrandOwnerRepository<F>,
  ) {}

  public createBrandOwner(user: User): Kind<F, [BrandOwner]> {
    return this.repo.save(BrandOwner(BrandOwnerId(UserId.toUUID(user.id))));
  }
}
