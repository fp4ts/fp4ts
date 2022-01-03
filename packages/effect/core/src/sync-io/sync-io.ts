// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $type, TyK, TyVar } from '@fp4ts/core';
import {
  Applicative,
  Apply,
  FlatMap,
  Functor,
  Monad,
  MonadError,
} from '@fp4ts/cats';
import { Sync } from '@fp4ts/effect-kernel';

import { SyncIO as SyncIOBase } from './algebra';
import { defer, delay, pure, throwError } from './constructors';
import {
  syncIoApplicative,
  syncIoApply,
  syncIoFlatMap,
  syncIoFunctor,
  syncIoMonad,
  syncIoMonadError,
  syncIoSync,
} from './instances';

export type SyncIO<A> = SyncIOBase<A>;

export const SyncIO: SyncIOObj = function <A>(thunk: () => A): SyncIO<A> {
  return delay(thunk);
} as any;

interface SyncIOObj {
  <A>(thunk: () => A): SyncIO<A>;
  pure<A>(a: A): SyncIO<A>;
  unit: SyncIO<void>;
  delay<A>(thunk: () => A): SyncIO<A>;
  defer<A>(thunk: () => SyncIO<A>): SyncIO<A>;
  throwError(e: Error): SyncIO<never>;

  // -- Instances

  readonly Functor: Functor<SyncIoK>;
  readonly Apply: Apply<SyncIoK>;
  readonly Applicative: Applicative<SyncIoK>;
  readonly FlatMap: FlatMap<SyncIoK>;
  readonly Monad: Monad<SyncIoK>;
  readonly MonadError: MonadError<SyncIoK, Error>;
  readonly Sync: Sync<SyncIoK>;
}

SyncIO.pure = pure;
SyncIO.unit = pure(undefined);
SyncIO.delay = delay;
SyncIO.defer = defer;
SyncIO.throwError = throwError;

Object.defineProperty(SyncIO, 'Functor', {
  get() {
    return syncIoFunctor();
  },
});
Object.defineProperty(SyncIO, 'Apply', {
  get() {
    return syncIoApply();
  },
});
Object.defineProperty(SyncIO, 'Applicative', {
  get() {
    return syncIoApplicative();
  },
});
Object.defineProperty(SyncIO, 'FlatMap', {
  get() {
    return syncIoFlatMap();
  },
});
Object.defineProperty(SyncIO, 'Monad', {
  get() {
    return syncIoMonad();
  },
});
Object.defineProperty(SyncIO, 'MonadError', {
  get() {
    return syncIoMonadError();
  },
});
Object.defineProperty(SyncIO, 'Sync', {
  get() {
    return syncIoSync();
  },
});

// -- HKT

export interface SyncIoK extends TyK<[unknown]> {
  [$type]: SyncIO<TyVar<this, 0>>;
}
