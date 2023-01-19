// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { coerce } from '@fp4ts/core';
import { Some } from '@fp4ts/cats';
import { Authority, Path, Uri } from '@fp4ts/http-core';
import { SocketAddress } from './socket-address';

export abstract class Server {
  public abstract readonly address: SocketAddress;
  public abstract readonly isSecure: boolean;

  public get baseUri(): Uri {
    return new Uri(
      Some(this.isSecure ? 'https' : 'http'),
      Some(
        new Authority(
          this.address.host.toString(),
          Some(coerce(this.address.port)),
        ),
      ),
      Path.Root,
    );
  }
}

// prettier-ignore
export const banner =
`   __         ___ _       
  / _|       /   | |      
 | |_ _ __  / /| | |_ ___ 
 |  _| '_ \\/ /_| | __/ __|
 | | | |_) \\___  | |_\\__ \\
 |_| | .__/    |_/\\__|___/
   | |                  
   |_|                  
`;
