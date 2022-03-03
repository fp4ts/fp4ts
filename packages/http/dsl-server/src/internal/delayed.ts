// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, applyTo, constant } from '@fp4ts/core';
import { FlatMap, Functor, Monad, ReaderT } from '@fp4ts/cats';
import { Request } from '@fp4ts/http-core';
import { DelayedCheck } from './delayed-check';
import { RouteResult, RouteResultT, RouteResultTF } from './route-result';

// -- Servant Delayed implementation
// -- https://github.com/haskell-servant/servant/blob/master/servant-server/src/Servant/Server/Internal/Delayed.hs#L92
export class Delayed<F, env, c> {
  public static empty<F>(
    F: Monad<F>,
  ): <A, env>(empty: RouteResult<A>) => Delayed<F, env, A> {
    const r = ReaderT.pure(RouteResultT.Monad(F))(undefined as void);
    return fea =>
      new Delayed(transform =>
        transform({
          captures: constant(r),
          method: r,
          accept: r,
          content: r,
          params: r,
          headers: r,
          body: constant(r),
          server: () => RouteResultT.lift(F)(fea),
        }),
      );
  }

  public constructor(
    // T - Result of the computation over the existential record
    public readonly fold: <T>(
      // Existential types
      transform: <captures, contentType, params, headers, body>(
        props: DelayedProps<
          F,
          env,
          c,
          captures,
          contentType,
          params,
          headers,
          body
        >,
      ) => T,
    ) => T,
  ) {}

  public map(
    F: Functor<$<RouteResultTF, [F]>>,
  ): <d>(f: (c: c) => d) => Delayed<F, env, d> {
    return f =>
      new Delayed(transform =>
        this.fold(props =>
          transform({
            ...props,
            server: (...xs) => F.map_(props.server(...xs), f),
          }),
        ),
      );
  }

  public addCapture<A, B>(
    this: Delayed<F, env, (a: A) => B>,
    F: FlatMap<$<RouteResultTF, [F]>>,
  ): <captured>(
    f: (c: captured) => DelayedCheck<F, A>,
  ) => Delayed<F, [captured, env], B> {
    return <captured>(
      f: (c: captured) => DelayedCheck<F, A>,
    ): Delayed<F, [captured, env], B> =>
      new Delayed(transform =>
        this.fold(props =>
          transform({
            ...props,
            captures: ([txt, env]) => props.captures(env).product(F)(f(txt)),
            server: ([x, v]: [capturesOf<typeof props>, A], p, h, b, req) =>
              F.map_(props.server(x, p, h, b, req), applyTo(v)),
          }),
        ),
      );
  }

  public addParamCheck<A, B>(
    this: Delayed<F, env, (a: A) => B>,
    F: FlatMap<$<RouteResultTF, [F]>>,
  ): (that: DelayedCheck<F, A>) => Delayed<F, env, B> {
    return that =>
      new Delayed(transform =>
        this.fold(props =>
          transform({
            ...props,
            params: props.params.product(F)(that),
            server: (c, [p, pNew], h, b, req) =>
              F.map_(props.server(c, p, h, b, req), applyTo(pNew)),
          }),
        ),
      );
  }

  public addHeaderCheck<A, B>(
    this: Delayed<F, env, (a: A) => B>,
    F: FlatMap<$<RouteResultTF, [F]>>,
  ): (that: DelayedCheck<F, A>) => Delayed<F, env, B> {
    return that =>
      new Delayed(transform =>
        this.fold(props =>
          transform({
            ...props,
            headers: props.headers.product(F)(that),
            server: (c, p, [h, hNew], b, req) =>
              F.map_(props.server(c, p, h, b, req), applyTo(hNew)),
          }),
        ),
      );
  }

  public addMethodCheck(
    F: FlatMap<$<RouteResultTF, [F]>>,
  ): (that: DelayedCheck<F, void>) => Delayed<F, env, c> {
    return that =>
      new Delayed(transform =>
        this.fold(props =>
          transform({ ...props, method: props.method.productL(F)(that) }),
        ),
      );
  }

  public addBodyCheck<A, B>(
    this: Delayed<F, env, (a: A) => B>,
    F: FlatMap<$<RouteResultTF, [F]>>,
  ): <C>(
    that: DelayedCheck<F, C>,
    f: (c: C) => DelayedCheck<F, A>,
  ) => Delayed<F, env, B> {
    return <C>(
      newContent: DelayedCheck<F, C>,
      newBody: (c: C) => DelayedCheck<F, A>,
    ) =>
      new Delayed(transform =>
        this.fold(props =>
          transform({
            ...props,
            content: props.content.product(F)(newContent),
            body: ([content, c]: [contentTypeOf<typeof props>, C]) =>
              props.body(content).product(F)(newBody(c)),
            server: (c, p, h, [z, v], req) =>
              F.map_(props.server(c, p, h, z, req), applyTo(v)),
          }),
        ),
      );
  }

  public addAcceptCheck(
    F: FlatMap<$<RouteResultTF, [F]>>,
  ): (that: DelayedCheck<F, void>) => Delayed<F, env, c> {
    return that =>
      new Delayed(transform =>
        this.fold(props =>
          transform({
            ...props,
            accept: props.accept.productL(F)(that),
          }),
        ),
      );
  }

  public passToServer<A, B>(
    this: Delayed<F, env, (a: A) => B>,
    F: FlatMap<$<RouteResultTF, [F]>>,
  ): (f: (req: Request<F>) => A) => Delayed<F, env, B> {
    return f =>
      new Delayed(transform =>
        this.fold(props =>
          transform({
            ...props,
            server: (c, p, h, b, req) =>
              F.map_(props.server(c, p, h, b, req), applyTo(f(req))),
          }),
        ),
      );
  }

  public runDelayed(
    F: Monad<$<RouteResultTF, [F]>>,
  ): (env: env, req: Request<F>) => RouteResultT<F, c> {
    const RF = ReaderT.Monad<$<RouteResultTF, [F]>, Request<F>>(F);
    return (env, req) =>
      this.fold(props =>
        RF.do(function* (_) {
          const c = yield* _(props.captures(env));
          yield* _(props.method);
          yield* _(props.accept);
          const content = yield* _(props.content);
          const p = yield* _(props.params);
          const h = yield* _(props.headers);
          const b = yield* _(props.body(content));
          return yield* _(
            DelayedCheck.liftRouteResult(props.server(c, p, h, b, req)),
          );
        }).run(req),
      );
  }
}

type capturesOf<X> = X extends DelayedProps<
  any,
  any,
  any,
  infer captures,
  any,
  any,
  any,
  any
>
  ? captures
  : never;

type contentTypeOf<X> = X extends DelayedProps<
  any,
  any,
  any,
  any,
  infer contentType,
  any,
  any,
  any
>
  ? contentType
  : never;

interface DelayedProps<
  F,
  env,
  c,
  captures,
  contentType,
  params,
  headers,
  body,
> {
  readonly captures: (e: env) => DelayedCheck<F, captures>;
  readonly method: DelayedCheck<F, void>;
  readonly accept: DelayedCheck<F, void>;
  readonly content: DelayedCheck<F, contentType>;
  readonly params: DelayedCheck<F, params>;
  readonly headers: DelayedCheck<F, headers>;
  readonly body: (ct: contentType) => DelayedCheck<F, body>;
  readonly server: (
    ...xs: [captures, params, headers, body, Request<F>]
  ) => RouteResultT<F, c>;
}
