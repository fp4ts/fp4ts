// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { IpAddress } from './ip-address';
import { Port } from './port';

export class SocketAddress {
  private readonly __void!: void;

  public constructor(
    public readonly host: IpAddress,
    public readonly port: Port,
  ) {}

  public toString(): string {
    return this.host.fold(
      v4 => `${v4}:${this.port}`,
      v6 => `[${v6}]:${this.port}`,
    );
  }
}
