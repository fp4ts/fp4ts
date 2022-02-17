// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Either } from '@fp4ts/cats';

export abstract class SyncIO<A> {
  private readonly __void!: void;
}

export class Pure<A> extends SyncIO<A> {
  public readonly tag = 0;
  public constructor(public readonly value: A) {
    super();
  }
}

export class Fail extends SyncIO<never> {
  public readonly tag = 1;
  public constructor(public readonly error: Error) {
    super();
  }
}

export class Delay<A> extends SyncIO<A> {
  public readonly tag = 2;
  public constructor(public readonly thunk: () => A) {
    super();
  }
}

export class Defer<A> extends SyncIO<A> {
  public readonly tag = 3;
  public constructor(public readonly thunk: () => SyncIO<A>) {
    super();
  }
}

export class Map<E, A> extends SyncIO<A> {
  public readonly tag = 4;
  public constructor(
    public readonly self: SyncIO<E>,
    public readonly fun: (e: E) => A,
  ) {
    super();
  }
}

export class FlatMap<E, A> extends SyncIO<A> {
  public readonly tag = 5;
  public constructor(
    public readonly self: SyncIO<E>,
    public readonly fun: (e: E) => SyncIO<A>,
  ) {
    super();
  }
}

export class HandleErrorWith<A> extends SyncIO<A> {
  public readonly tag = 6;
  public constructor(
    public readonly self: SyncIO<A>,
    public readonly fun: (e: Error) => SyncIO<A>,
  ) {
    super();
  }
}

export class Attempt<A> extends SyncIO<Either<Error, A>> {
  public readonly tag = 7;
  public constructor(public readonly self: SyncIO<A>) {
    super();
  }
}

export type View<A> =
  | Pure<A>
  | Fail
  | Delay<A>
  | Defer<A>
  | Map<any, A>
  | FlatMap<any, A>
  | HandleErrorWith<A>
  | Attempt<A>;

export const view = <A>(_: SyncIO<A>): View<A> => _ as any;

export const MapK = 0;
export const FlatMapK = 1;
export const HandleErrorWithK = 2;
export const AttemptK = 3;

export enum Continuation {
  MapK,
  FlatMapK,
  HandleErrorWithK,
  AttemptK,
}
