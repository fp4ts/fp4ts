// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import http from 'http';
import { AddressInfo } from 'net';
import { IpAddress, Port, Server, SocketAddress } from '@fp4ts/http-server';

export class NodeServer extends Server {
  public readonly isSecure: boolean;
  public readonly address: SocketAddress;

  public constructor(public readonly underlying: http.Server) {
    super();

    const addr = this.underlying.address() as AddressInfo;
    this.isSecure = false;
    this.address = new SocketAddress(
      IpAddress.fromString(addr.address).get,
      Port.fromNumber(addr.port).get,
    );
  }
}
