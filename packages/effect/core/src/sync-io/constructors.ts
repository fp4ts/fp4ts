// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Defer, Delay, Fail, Pure, SyncIO } from './algebra';

export const pure = <A>(a: A): SyncIO<A> => new Pure(a);

export const delay = <A>(thunk: () => A): SyncIO<A> => new Delay(thunk);

export const defer = <A>(thunk: () => SyncIO<A>): SyncIO<A> => new Defer(thunk);

export const throwError = (e: Error): SyncIO<never> => new Fail(e);
