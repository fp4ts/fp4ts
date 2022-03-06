// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Functor, Kleisli } from '@fp4ts/cats';
import { Request } from './request';

export class ContextRequest<F, A> {
  public constructor(
    public readonly context: A,
    public readonly request: Request<F>,
  ) {}

  public static create<F>(F: Functor<F>) {
    return <A>(
      getContext: (req: Request<F>) => Kind<F, [A]>,
    ): Kleisli<F, Request<F>, ContextRequest<F, A>> =>
      Kleisli(req =>
        F.map_(getContext(req), ctx => new ContextRequest(ctx, req)),
      );
  }
}

export type AuthedRequest<F, A> = ContextRequest<F, A>;
export const AuthedRequest = ContextRequest;
