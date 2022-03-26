// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, id, TyK, TyVar } from '@fp4ts/core';
import { Stream } from '@fp4ts/stream';
import { Free, FreeF } from '@fp4ts/cats-free';
import { Request, Response } from '@fp4ts/http-core';

import { ClientError } from './client-error';
import { RunClient } from './internal/run-client';

export abstract class FreeClient<F, A> {
  public abstract fold<B, C = B, D = C>(
    onError: (e: ClientError<F>) => B,
    onCompile: (stream: Stream<F, string>) => C,
    onRunRequest: (req: Request<F>, respond: (res: Response<F>) => A) => D,
  ): B | C | D;

  public static RunClient<F>(): RunClient<$<FreeF, [$<FreeClientF, [F]>]>, F> {
    return RunClient.of<$<FreeF, [$<FreeClientF, [F]>]>, F>(
      Free.Monad<$<FreeClientF, [F]>>(),
      {
        runRequest: req =>
          Free.suspend(new RunRequest<F, Response<F>>(req, id)),
        compileBody: bodyText => Free.suspend(new CompileBody(bodyText)),
        throwClientError: e => Free.suspend(new ThrowError(e)),
      },
    );
  }
}

export class RunRequest<F, A> extends FreeClient<F, A> {
  public constructor(
    public readonly req: Request<F>,
    public readonly respond: (res: Response<F>) => A,
  ) {
    super();
  }

  public fold<B, C = B, D = C>(
    onError: (e: ClientError<F>) => B,
    onCompile: (stream: Stream<F, string>) => C,
    onRunRequest: (req: Request<F>, respond: (res: Response<F>) => A) => D,
  ): B | C | D {
    return onRunRequest(this.req, this.respond);
  }
}

export class CompileBody<F> extends FreeClient<F, string> {
  public constructor(public readonly bodyText: Stream<F, string>) {
    super();
  }

  public fold<B, C = B, D = C>(
    onError: (e: ClientError<F>) => B,
    onCompile: (stream: Stream<F, string>) => C,
    onRunRequest: (req: Request<F>, respond: (res: Response<F>) => string) => D,
  ): B | C | D {
    return onCompile(this.bodyText);
  }
}

export class ThrowError<F, A = never> extends FreeClient<F, A> {
  public constructor(public readonly error: ClientError<F>) {
    super();
  }

  public fold<B, C = B, D = C>(
    onError: (e: ClientError<F>) => B,
    onCompile: (stream: Stream<F, string>) => C,
    onRunRequest: (req: Request<F>, respond: (res: Response<F>) => A) => D,
  ): B | C | D {
    return onError(this.error);
  }
}

export interface FreeClientF extends TyK<[unknown, unknown]> {
  [$type]: FreeClient<TyVar<this, 0>, TyVar<this, 1>>;
}
