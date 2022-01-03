// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, Kind, TyK, TyVar } from '@fp4ts/core';
import {
  Functor,
  ApplicativeError,
  Applicative,
  Monad,
  Either,
} from '@fp4ts/cats';

import { Poll } from '../poll';
import { Async } from '../async';
import { Clock } from '../clock';
import { Temporal } from '../temporal';
import { Concurrent } from '../concurrent';
import { Spawn } from '../spawn';
import { Sync } from '../sync';
import { MonadCancel } from '../monad-cancel';

import { Resource as ResourceBase } from './algebra';
import {
  resourceApplicative,
  resourceAsync,
  resourceClock,
  resourceConcurrent,
  resourceMonad,
  resourceMonadCancel,
  resourceSync,
  resourceTemporal,
} from './instances';
import {
  allocate,
  allocateCase,
  allocateFull,
  canceled,
  defer,
  delay,
  evalF,
  liftF,
  make,
  makeFull,
  never,
  pure,
  suspend,
  tailRecM,
  tailRecM_,
  throwError,
  uncancelable,
} from './constructors';
import { ExitCase } from './exit-case';

export type Resource<F, A> = ResourceBase<F, A>;

export const Resource: ResourceObj = function (F) {
  return allocate(F);
};

interface ResourceObj {
  <F>(F: Functor<F>): <A>(
    resource: Kind<F, [[A, Kind<F, [void]>]]>,
  ) => Resource<F, A>;

  pure<F, A>(a: A): Resource<F, A>;
  liftF<F, A>(fa: Kind<F, [Resource<F, A>]>): Resource<F, A>;
  evalF<F, A>(fa: Kind<F, [A]>): Resource<F, A>;

  allocate<F>(
    F: Functor<F>,
  ): <A>(resource: Kind<F, [[A, Kind<F, [void]>]]>) => Resource<F, A>;
  allocateCase<F, A>(
    resource: Kind<F, [[A, (e: ExitCase) => Kind<F, [void]>]]>,
  ): Resource<F, A>;
  allocateFull<F, A>(
    resource: (p: Poll<F>) => Kind<F, [[A, (e: ExitCase) => Kind<F, [void]>]]>,
  ): Resource<F, A>;

  make<F>(
    F: Functor<F>,
  ): <A>(
    acquire: Kind<F, [A]>,
    release: (a: A, e: ExitCase) => Kind<F, [void]>,
  ) => Resource<F, A>;

  makeFull<F>(
    F: Functor<F>,
  ): <A>(
    acquire: (p: Poll<F>) => Kind<F, [A]>,
    release: (a: A, e: ExitCase) => Kind<F, [void]>,
  ) => Resource<F, A>;

  tailRecM<S>(
    s: S,
  ): <F, A>(f: (s: S) => Resource<F, Either<S, A>>) => Resource<F, A>;
  tailRecM_<F, A, S>(
    s: S,
    f: (s: S) => Resource<F, Either<S, A>>,
  ): Resource<F, A>;

  throwError<F>(
    F: ApplicativeError<F, Error>,
  ): (e: Error) => Resource<F, never>;

  canceled<F>(F: MonadCancel<F, Error>): Resource<F, void>;
  uncancelable<F>(
    F: MonadCancel<F, Error>,
  ): <A>(
    body: (p: Poll<$<ResourceK, [F]>>) => Resource<F, A>,
  ) => Resource<F, A>;

  delay<F>(F: Sync<F>): <A>(thunk: () => A) => Resource<F, A>;
  defer<F>(F: Sync<F>): <A>(thunk: () => Resource<F, A>) => Resource<F, A>;
  suspend<F>(F: Spawn<F, Error>): Resource<F, void>;
  never<F>(F: Spawn<F, Error>): Resource<F, never>;

  // -- Instances

  Applicative<F>(): Applicative<$<ResourceK, [F]>>;
  Monad<F>(): Monad<$<ResourceK, [F]>>;
  MonadCancel<F>(
    F: MonadCancel<F, Error>,
  ): MonadCancel<$<ResourceK, [F]>, Error>;
  Clock<F>(F: Clock<F>): Clock<$<ResourceK, [F]>>;
  Concurrent<F>(F: Concurrent<F, Error>): Concurrent<$<ResourceK, [F]>, Error>;
  Temporal<F>(F: Temporal<F, Error>): Temporal<$<ResourceK, [F]>, Error>;
  Sync<F>(F: Sync<F>): Sync<$<ResourceK, [F]>>;
  Async<F>(F: Async<F>): Async<$<ResourceK, [F]>>;
}

Resource.pure = pure;
Resource.liftF = liftF;
Resource.evalF = evalF;

Resource.allocate = allocate;
Resource.allocateCase = allocateCase;
Resource.allocateFull = allocateFull;
Resource.make = make;
Resource.makeFull = makeFull;
Resource.tailRecM = tailRecM;
Resource.tailRecM_ = tailRecM_;
Resource.throwError = throwError;
Resource.canceled = canceled;
Resource.uncancelable = uncancelable;
Resource.delay = delay;
Resource.defer = defer;
Resource.suspend = suspend;
Resource.never = never;

Resource.Applicative = resourceApplicative;
Resource.Monad = resourceMonad;
Resource.MonadCancel = resourceMonadCancel;
Resource.Clock = resourceClock;
Resource.Concurrent = resourceConcurrent;
Resource.Temporal = resourceTemporal;
Resource.Sync = resourceSync;
Resource.Async = resourceAsync;
Resource.Async = resourceAsync;

// -- HKT

export interface ResourceK extends TyK<[unknown, unknown]> {
  [$type]: Resource<TyVar<this, 0>, TyVar<this, 1>>;
}
