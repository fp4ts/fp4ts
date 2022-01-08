import { $, applyTo, constant, id, Kind, pipe } from '@fp4ts/core';
import {
  Applicative,
  EitherT,
  EitherTK,
  FlatMap,
  Functor,
  Kleisli,
  Monad,
  ReaderT,
} from '@fp4ts/cats';
import { MessageFailure, Request, Response } from '@fp4ts/http-core';
import { Handler as RouteHandler } from '@fp4ts/http-routing';
import { DelayedT } from './delayed-t';
import { Handler } from './handler';

// -- Servant Delayed implementation
// -- https://github.com/haskell-servant/servant/blob/master/servant-server/src/Servant/Server/Internal/Delayed.hs#L92
export class Delayed<F, env, c> {
  public static empty<F>(
    F: Applicative<$<EitherTK, [F, MessageFailure]>>,
  ): <A, env>(fea: EitherT<F, MessageFailure, A>) => Delayed<F, env, A> {
    const r = ReaderT.pure(F)(undefined as void);
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
          server: () => fea,
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
    F: Functor<$<EitherTK, [F, MessageFailure]>>,
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
    F: FlatMap<$<EitherTK, [F, MessageFailure]>>,
  ): <captured>(
    f: (c: captured) => DelayedT<F, A>,
  ) => Delayed<F, [captured, env], B> {
    return <captured>(
      f: (c: captured) => DelayedT<F, A>,
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
    F: FlatMap<$<EitherTK, [F, MessageFailure]>>,
  ): (that: DelayedT<F, A>) => Delayed<F, env, B> {
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
    F: FlatMap<$<EitherTK, [F, MessageFailure]>>,
  ): (that: DelayedT<F, A>) => Delayed<F, env, B> {
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
    F: FlatMap<$<EitherTK, [F, MessageFailure]>>,
  ): (that: DelayedT<F, void>) => Delayed<F, env, c> {
    return that =>
      new Delayed(transform =>
        this.fold(props =>
          transform({ ...props, method: props.method.productL(F)(that) }),
        ),
      );
  }

  public addBodyCheck<A, B>(
    this: Delayed<F, env, (a: A) => B>,
    F: FlatMap<$<EitherTK, [F, MessageFailure]>>,
  ): <C>(
    that: DelayedT<F, C>,
    f: (c: C) => DelayedT<F, A>,
  ) => Delayed<F, env, B> {
    return <C>(newContent: DelayedT<F, C>, newBody: (c: C) => DelayedT<F, A>) =>
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
    F: FlatMap<$<EitherTK, [F, MessageFailure]>>,
  ): (that: DelayedT<F, void>) => Delayed<F, env, c> {
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
    F: FlatMap<$<EitherTK, [F, MessageFailure]>>,
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
    F: Monad<$<EitherTK, [F, MessageFailure]>>,
  ): (env: env) => (req: Request<F>) => EitherT<F, MessageFailure, c> {
    const RF = ReaderT.Monad<$<EitherTK, [F, MessageFailure]>, Request<F>>(F);
    return env => req =>
      this.fold(props => {
        const r = pipe(
          RF.Do,
          RF.bindTo('r', ReaderT.ask(F)),
          RF.bindTo('c', props.captures(env)),
          RF.bind(props.method),
          RF.bind(props.accept),
          RF.bindTo('content', props.content),
          RF.bindTo('p', props.params),
          RF.bindTo('h', props.headers),
          RF.bindTo('b', ({ content }) => props.body(content)),
        )
          .flatMapF(F)(({ c, p, h, b, r }) => props.server(c, p, h, b, r))
          .run(req);
        return r;
      });
  }

  public toHttp<A>(
    this: Delayed<F, env, Handler<F, A>>,
    F: Monad<F>,
  ): (
    env: env,
  ) => (
    k: (a: A) => EitherT<F, MessageFailure, Response<F>>,
  ) => RouteHandler<F> {
    const EF = EitherT.Monad<F, MessageFailure>(F);
    return env => k =>
      Kleisli(req =>
        pipe(
          this.runDelayed(EF)(env)(req),
          EF.flatten,
          EF.flatMap(k),
          fea => fea.value,
          F.map(ea =>
            ea.fold(failure => failure.toHttpResponse(req.httpVersion), id),
          ),
        ),
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
  readonly captures: (e: env) => DelayedT<F, captures>;
  readonly method: DelayedT<F, void>;
  readonly accept: DelayedT<F, void>;
  readonly content: DelayedT<F, contentType>;
  readonly params: DelayedT<F, params>;
  readonly headers: DelayedT<F, headers>;
  readonly body: (ct: contentType) => DelayedT<F, body>;
  readonly server: (
    ...xs: [captures, params, headers, body, Request<F>]
  ) => EitherT<F, MessageFailure, c>;
}
