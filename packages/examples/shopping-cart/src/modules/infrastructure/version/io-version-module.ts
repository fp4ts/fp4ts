// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { IO, IOF } from '@fp4ts/effect';
import { VersionApiService } from '../../application/version';

export class IOVersionModule {
  public static make(): IO<IOVersionModule> {
    return IO.pure(new IOVersionModule(new VersionApiService(IO.Concurrent)));
  }

  private constructor(public readonly apiService: VersionApiService<IOF>) {}
}
