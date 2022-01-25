// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { MessageFailure } from '@fp4ts/http-core';

export abstract class RouteResult<A> {
  public readonly __void!: void;
}

export class Route<A> extends RouteResult<A> {
  public readonly tag = 'route';

  public constructor(public readonly value: A) {
    super();
  }
}

export const Fail = new (class Fail extends RouteResult<never> {
  public readonly tag = 'fail';
})();
export type Fail = typeof Fail;

export class FatalFail extends RouteResult<never> {
  public readonly tag = 'fatal-fail';
  public constructor(public readonly failure: MessageFailure) {
    super();
  }
}

export type View<A> = Route<A> | Fail | FatalFail;
export const view = <A>(_: RouteResult<A>): View<A> => _ as any;

export class RouteResultT<F, A> {
  private readonly __void!: void;

  public constructor(public readonly value: Kind<F, [RouteResult<A>]>) {}
}
