// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Concurrent } from '@fp4ts/effect';
import { HttpApp } from '@fp4ts/http';
import { builtins, toHttpApp } from '@fp4ts/http-dsl-server';
import { VersionApi } from './version-api';
import { Version } from './version-dto';

export class VersionApiService<F> {
  public constructor(private readonly F: Concurrent<F, Error>) {}

  public get toHttpApp(): HttpApp<F> {
    return toHttpApp(this.F)(VersionApi, {
      ...builtins,
      'application/json': {
        '@fp4ts/shopping-cart/version-dto': Version.jsonCodec,
      },
    })(S => S.return({ version: 'v1.0.0' }));
  }
}
