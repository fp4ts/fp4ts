import { $, $type, Kind, TyK, TyVar } from '@fp4ts/core';
import {
  Either,
  EitherT,
  EitherTK,
  Left,
  List,
  Monad,
  None,
  ReaderT,
  Right,
  Some,
} from '@fp4ts/cats';
import { Concurrent, IO, IoK } from '@fp4ts/effect';
import {
  ConstantPathComponent,
  ParameterPathComponent,
  PathComponent,
  Route,
  ServerRouter,
} from '@fp4ts/http-routing';

import * as dsl from '@fp4ts/http-dsl';
import {
  Alt,
  CaptureElement,
  NoContentVerbElement,
  PathElement,
  Sub,
  VerbElement,
  QueryParamElement,
  ContentType as DslContentType,
  ReqBodyElement,
} from '@fp4ts/http-dsl/lib/api';

import { Context, EmptyContext } from './context';
import { Delayed } from './delayed';
import { Handler, HandlerK } from './handler';
import {
  ContentType,
  EntityEncoder,
  EntityDecoder,
  MessageFailure,
  Method,
  ParsingFailure,
  Request,
  Response,
  Status,
} from '@fp4ts/http-core';
import { DelayedT } from './delayed-t';
import { Schema } from '@fp4ts/schema';

const ServerTK = Symbol('ServerTK');
type ServerTK = typeof ServerTK;

// prettier-ignore
type ServerT<T, api> = T extends { [ServerTK]: infer ServerTK }
  ? $<ServerTK, [api]> : never;

// prettier-ignore
type Server<T, F, api> = T extends { [ServerTK]: infer ServerTK }
  ? Kind<ServerTK, [api, $<HandlerK, [F]>]> : never;

interface Routable<api, ctx extends unknown[]> {
  route<F>(
    F: Concurrent<F, Error>,
  ): <env>(
    api: api,
    ctx: Context<ctx>,
    d: Delayed<F, env, Server<this, F, api>>,
  ) => List<Route<F>>;
}

// -- Alternative

function altRoutable<a, b, context extends unknown[], sta, stb>(
  ra: Routable<a, context> & { [ServerTK]: sta },
  rb: Routable<b, context> & { [ServerTK]: stb },
): Routable<Alt<a, b>, context> & { [ServerTK]: AltK<sta, stb> } {
  return {
    [ServerTK]: null as any as AltK<sta, stb>,
    route: <F>(F: Concurrent<F, Error>) => {
      const EF = EitherT.Functor<F, MessageFailure>(F);
      return <env>(
        api: Alt<a, b>,
        ctx: Context<context>,
        delayed: Delayed<
          F,
          env,
          Alt<
            Kind<sta, [a, $<HandlerK, [F]>]>,
            Kind<stb, [b, $<HandlerK, [F]>]>
          >
        >,
      ) => {
        const lhs = ra.route(F)(
          api.lhs,
          ctx,
          delayed.map(EF)(alt => alt.lhs),
        );
        const rhs = rb.route(F)(
          api.rhs,
          ctx,
          delayed.map(EF)(alt => alt.rhs),
        );
        return lhs['+++'](rhs);
      };
    },
  };
}

interface AltK<sta, stb> extends TyK<[unknown, unknown]> {
  [$type]: TyVar<this, 0> extends Alt<infer a, infer b>
    ? Alt<Kind<sta, [a, TyVar<this, 1>]>, Kind<stb, [b, TyVar<this, 1>]>>
    : never;
}

// -- Capture

function captureRoutable<
  S extends string,
  A,
  r,
  context extends unknown[],
  str,
>(
  parse: (s: unknown) => Either<string, A>,
  rr: Routable<r, context> & { [ServerTK]: str },
): Routable<Sub<CaptureElement<S, A>, r>, context> & {
  [ServerTK]: CaptureK<str>;
} {
  return {
    [ServerTK]: null as any as CaptureK<str>,
    route:
      <F>(F: Concurrent<F, Error>) =>
      <env>(
        api: Sub<CaptureElement<S, A>, r>,
        ctx: Context<context>,
        delayed: Delayed<F, env, (x: A) => Kind<str, [r, $<HandlerK, [F]>]>>,
      ) =>
        rr
          .route(F)(
            api.rhs,
            ctx,
            delayed.addCapture(EitherT.Monad(F))(x =>
              ReaderT(req =>
                EitherT(
                  F.pure(
                    parse(x).leftMap(reason => new ParsingFailure(reason)),
                  ),
                ),
              ),
            ),
          )
          .map(route =>
            route.withComponent(new ParameterPathComponent(api.lhs.name)),
          ),
  };
}

interface CaptureK<str> extends TyK<[unknown, unknown]> {
  [$type]: TyVar<this, 0> extends Sub<CaptureElement<any, infer a>, infer api>
    ? (x: a) => Kind<str, [api, TyVar<this, 1>]>
    : never;
}

// -- Path element

function pathElementRoutable<r, context extends unknown[], str>(
  rr: Routable<r, context> & { [ServerTK]: str },
): Routable<Sub<PathElement<any>, r>, context> & {
  [ServerTK]: PathElementK<str>;
} {
  return {
    [ServerTK]: null as any as PathElementK<str>,
    route:
      <F>(F: Concurrent<F, Error>) =>
      <env>(
        api: Sub<PathElement<any>, r>,
        ctx: Context<context>,
        delayed: Delayed<F, env, Kind<str, [r, $<HandlerK, [F]>]>>,
      ) =>
        rr
          .route(F)(api.rhs, ctx, delayed)
          .map(path =>
            path.withComponent(new ConstantPathComponent(api.lhs.value)),
          ),
  };
}

interface PathElementK<str> extends TyK<[unknown, unknown]> {
  [$type]: TyVar<this, 0> extends Sub<PathElement<any>, infer r>
    ? Kind<str, [r, TyVar<this, 1>]>
    : never;
}

// -- Req Body

function reqBodyRoutable<
  cts extends DslContentType[],
  B,
  r,
  context extends unknown[],
  str,
>(
  decoder: <F>(F: Concurrent<F, Error>) => EntityDecoder<F, B>,
  rr: Routable<r, context> & { [ServerTK]: str },
): Routable<Sub<ReqBodyElement<cts, B>, r>, context> & {
  [ServerTK]: ReqBodyK<str>;
} {
  return {
    [ServerTK]: null as any as ReqBodyK<str>,
    route: <F>(F: Concurrent<F, Error>) => {
      const d = decoder(F);
      const ctCheck = DelayedT.withRequest(F)<Request<F>>(req =>
        ReaderT.liftF(
          EitherT(
            F.pure(
              req.headers
                .get(ContentType.Select)
                .flatMap(ct => (d.canConsume(ct.mediaType) ? Some(req) : None))
                .toRight(() => new ParsingFailure('Invalid media type')),
            ),
          ),
        ),
      );

      const parseBody = (req: Request<F>) =>
        ReaderT.liftF<$<EitherTK, [F, MessageFailure]>, B>(
          d.decode(req).leftMap(F)(
            failure => new ParsingFailure(failure.cause.getOrElse(() => '')),
          ),
        );

      return <env>(
        api: Sub<ReqBodyElement<cts, B>, r>,
        ctx: Context<context>,
        d: Delayed<F, env, (b: B) => Kind<str, [r, $<HandlerK, [F]>]>>,
      ) => {
        return rr.route(F)(
          api.rhs,
          ctx,
          d.addBodyCheck(EitherT.Monad(F))(ctCheck, parseBody),
        );
      };
    },
  };
}

interface ReqBodyK<str> extends TyK<[unknown, unknown]> {
  [$type]: TyVar<this, 0> extends Sub<ReqBodyElement<any, infer a>, infer api>
    ? (x: a) => Kind<str, [api, TyVar<this, 1>]>
    : never;
}

// -- CONTENT RESPONSE

function verbRoutable<
  cts extends DslContentType[],
  A,
  context extends unknown[],
>(
  f: <F>(F: Monad<F>) => EntityEncoder<F, A>,
): Routable<VerbElement<any, any, cts, A>, context> & { [ServerTK]: VerbK<A> } {
  return {
    [ServerTK]: null as any as VerbK<A>,
    route:
      <F>(F: Concurrent<F, Error>) =>
      <env>(
        api: VerbElement<any, any, cts, A>,
        ctx: Context<context>,
        delayed: Delayed<F, env, Handler<F, A>>,
      ) => {
        const method = Method.fromStringUnsafe(api.method);
        const http = delayed.toHttp(F)(null as any)(a =>
          EitherT.right(F)(
            new Response<F>(Status.Ok, '1.1').withEntity(a, f(F)),
          ),
        );
        return List(new Route(method, List.empty, http));
      },
  };
}

interface VerbK<a> extends TyK<[unknown, unknown]> {
  [$type]: Kind<TyVar<this, 1>, [a]>;
}

// -- NO CONTENT

function verbNoContentRoutable<
  M extends string,
  context extends unknown[],
>(): Routable<NoContentVerbElement<M>, context> & {
  [ServerTK]: VerbNoContentK;
} {
  return {
    [ServerTK]: null as any as VerbNoContentK,
    route:
      <F>(F: Concurrent<F, Error>) =>
      <env>(
        api: NoContentVerbElement<M>,
        context: Context<context>,
        delayed: Delayed<F, env, Handler<F, void>>,
      ) =>
        List(
          new Route(
            Method.fromStringUnsafe(api.method),
            List.empty,
            delayed.toHttp(F)(null as any as env)(() =>
              EitherT.pure(F)(Status.NoContent()),
            ),
          ),
        ),
  };
}

interface VerbNoContentK extends TyK<[unknown, unknown]> {
  [$type]: Kind<TyVar<this, 1>, [void]>;
}

const x = altRoutable(
  captureRoutable(
    s =>
      s === 'true'
        ? Right(true)
        : s === 'false'
        ? Right(false)
        : Left('Invalid boolean param'),
    verbNoContentRoutable(),
  ),
  reqBodyRoutable(F => EntityDecoder.text(F), verbNoContentRoutable()),
);

const versionApi = dsl.Route('version')[':>'](dsl.GetNoContent);
const pingApi = dsl
  .Route('ping')
  [':>'](dsl.Get([dsl.PlainText], Schema.string));
const echoApi = dsl
  .Route('echo')
  [':>'](dsl.ReqBody([dsl.PlainText], Schema.string))
  [':>'](dsl.Post([dsl.PlainText], Schema.string));

const api = dsl.group(versionApi, pingApi, echoApi);

const version = EitherT.rightT(IO.Monad)(IO.unit);
const ping = EitherT.rightT(IO.Monad)(IO.pure('pong'));
const echo = (s: string) => EitherT.rightT(IO.Monad)(IO.pure(s));

const server = dsl.group(version, ping, echo);

const routable = altRoutable(
  pathElementRoutable(verbNoContentRoutable()),
  altRoutable(
    pathElementRoutable(verbRoutable(F => EntityEncoder.text())),
    pathElementRoutable(
      reqBodyRoutable(
        F => EntityDecoder.text(F),
        verbRoutable(F => EntityEncoder.text()),
      ),
    ),
  ),
);

routable.route(IO.Concurrent)(
  api,
  EmptyContext,
  Delayed.empty(EitherT.Monad(IO.Monad))(EitherT.right(IO.Monad)(server)),
);
