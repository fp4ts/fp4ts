// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Concurrent } from '@fp4ts/effect';
import { HttpApp } from '@fp4ts/http';
import { toHttpApp } from '@fp4ts/http-dsl-server';

import { Api } from './api';
import { VersionApiService } from './version';
import { AuthApiService } from './auth';

export class ApiService<F> {
  public constructor(
    private readonly F: Concurrent<F, Error>,
    private readonly version: VersionApiService<F>,
    private readonly auth: AuthApiService<F>,
  ) {}

  public get toHttpApp(): HttpApp<F> {
    return toHttpApp(this.F)(Api, {})(() => [
      this.version.toHttpApp,
      this.auth.toHttpApp,
    ]);
  }
}
