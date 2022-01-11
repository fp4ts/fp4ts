// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/ban-types */
import { id, pipe } from '@fp4ts/core';
import { Either, EitherT, Kleisli, Left } from '@fp4ts/cats';
import {
  Accept,
  ContentType,
  EntityEncoder,
  Http,
  HttpApp,
  HttpRoutes,
  MessageFailure,
  ParsingFailure,
  Response,
  Status,
} from '@fp4ts/http-core';
import {
  Alt,
  Sub,
  VerbNoContent,
  CaptureElement,
  QueryElement,
  StaticElement,
  Verb,
  Type,
  ReqBodyElement,
  PlainText,
  ContentTypeWithMime,
} from '@fp4ts/http-dsl-shared';
import { Concurrent } from '@fp4ts/effect-kernel';
import { Context, EmptyContext } from './context';
import { Delayed } from './delayed';
import { DelayedCheck } from './delayed-check';
import {
  CaptureRouter,
  choice,
  leafRouter,
  pathRouter,
  Router,
  runRouterEnv,
} from './router';
import { Server, DeriveCoding, OmitBuiltins } from '../type-level';
import { builtins } from '../builtin-codables';

export const toApp =
  <F>(F: Concurrent<F, Error>) =>
  <api>(
    api: api,
    server: Server<F, api>,
    codings: OmitBuiltins<DeriveCoding<F, api>>,
  ): HttpApp<F> =>
    HttpRoutes.orNotFound(F)(toHttpRoutes(F)(api, server, codings));

export const toHttpRoutes =
  <F>(F: Concurrent<F, Error>) =>
  <api>(
    api: api,
    server: Server<F, api>,
    codings: OmitBuiltins<DeriveCoding<F, api>>,
  ): HttpRoutes<F> =>
    runRouterEnv(F)(
      route(F)(
        api,
        EmptyContext,
        Delayed.empty(EitherT.Monad<F, MessageFailure>(F))(
          EitherT.right(F)(server),
        ),
        { ...builtins, ...codings } as any,
      ),
      undefined as void,
    );

export const _toHttpRoutes =
  <F>(F: Concurrent<F, Error>) =>
  <api>(
    api: api,
    server: Server<F, api>,
    codings: DeriveCoding<F, api>,
  ): HttpRoutes<F> =>
    runRouterEnv(F)(
      route(F)(
        api,
        EmptyContext,
        Delayed.empty(EitherT.Monad<F, MessageFailure>(F))(
          EitherT.right(F)(server),
        ),
        codings,
      ),
      undefined as void,
    );

export function route<F>(F: Concurrent<F, Error>) {
  const EF = EitherT.Monad<F, MessageFailure>(F);
  function route<api, context extends unknown[], env>(
    api: api,
    ctx: Context<context>,
    server: Delayed<F, env, Server<F, api>>,
    codings: DeriveCoding<F, api>,
  ): Router<env, Http<F, F>> {
    if (api instanceof Alt) {
      return routeAlt(api, ctx, server, codings);
    }

    if (api instanceof Sub) {
      const { lhs, rhs } = api;
      if (lhs instanceof CaptureElement) {
        return routeCapture(lhs, rhs, ctx, server as any, codings as any);
      }
      if (lhs instanceof QueryElement) {
        return routeQuery(lhs, rhs, ctx, server as any, codings as any);
      }
      if (lhs instanceof StaticElement) {
        return routeStatic(lhs, rhs, ctx, server, codings);
      }
      if (lhs instanceof ReqBodyElement) {
        return routeReqBody(lhs, rhs, ctx, server as any, codings);
      }
      throw new Error('Invalid sub');
    }

    if (api instanceof Verb) {
      return routeVerbContent(api, ctx, server as any, codings);
    }

    if (api instanceof VerbNoContent) {
      return routeVerbNoContent(api, ctx, server as any, codings);
    }

    throw new Error('Invalid API');
  }

  function routeAlt<xs extends unknown[], context extends unknown[], env>(
    api: Alt<xs>,
    ctx: Context<context>,
    server: Delayed<F, env, Server<F, Alt<xs>>>,
    codings: DeriveCoding<F, Alt<xs>>,
  ): Router<env, Http<F, F>> {
    return choice(
      ...api.xs.map((x: any, i: number) =>
        route(
          x,
          ctx,
          server.map(EF)(xs => xs[i]),
          codings,
        ),
      ),
    );
  }

  function routeCapture<api, context extends unknown[], env, A>(
    a: CaptureElement<any, Type<any, A>>,
    api: api,
    ctx: Context<context>,
    d: Delayed<F, env, Server<F, Sub<CaptureElement<any, Type<any, A>>, api>>>,
    codings: DeriveCoding<F, Sub<CaptureElement<any, Type<any, A>>, api>>,
  ): Router<env, Http<F, F>> {
    const { decode } = codings[PlainText.mime][a.type.ref];
    return new CaptureRouter(
      route(
        api,
        ctx,
        d.addCapture(EF)(txt =>
          DelayedCheck.withRequest(F)(req => EitherT(F.pure(decode(txt)))),
        ),
        codings,
      ),
    );
  }

  function routeQuery<api, context extends unknown[], env, A>(
    a: QueryElement<any, Type<any, A>>,
    api: api,
    ctx: Context<context>,
    d: Delayed<F, env, Server<F, Sub<QueryElement<any, Type<any, A>>, api>>>,
    codings: DeriveCoding<F, Sub<CaptureElement<any, Type<any, A>>, api>>,
  ): Router<env, Http<F, F>> {
    const { decode } = codings[PlainText.mime][a.type.ref];
    return route(
      api,
      ctx,
      d.addParamCheck(EF)(
        DelayedCheck.withRequest(F)(req => {
          const value = req.uri.query.lookup(a.property);
          const result = value
            .map(v => v.traverse(Either.Applicative<MessageFailure>())(decode))
            .toRight(() => new ParsingFailure('Missing query'))
            .flatMap(id);
          return EitherT(F.pure(result));
        }),
      ),
      codings,
    );
  }

  function routeReqBody<
    api,
    context extends unknown[],
    env,
    A,
    M extends string,
    CT extends ContentTypeWithMime<M>,
  >(
    body: ReqBodyElement<CT, Type<any, A>>,
    api: api,
    ctx: Context<context>,
    d: Delayed<F, env, Server<F, Sub<ReqBodyElement<CT, Type<any, A>>, api>>>,
    codings: DeriveCoding<F, Sub<ReqBodyElement<CT, Type<any, A>>, api>>,
  ): Router<env, Http<F, F>> {
    const { decode } = codings[body.ct.mime][body.body.ref];
    const ctCheck = DelayedCheck.withRequest(F)(req =>
      req.headers.get(ContentType.Select).fold(
        () => EitherT.right(F)(req.bodyText),
        ct =>
          ct.mediaType.satisfies(body.ct.self.mediaType)
            ? EitherT.right(F)(req.bodyText)
            : EitherT.left(F)(new ParsingFailure('Invalid content type')),
      ),
    );

    return route(
      api,
      ctx,
      d.addBodyCheck(EF)(ctCheck, s =>
        Kleisli(() =>
          pipe(s.compileConcurrent(F).string, F.attempt, EitherT)
            .leftMap(F)(e => new ParsingFailure(e.message) as MessageFailure)
            .flatMap(F)(str => EitherT(F.pure(decode(str)))),
        ),
      ),
      codings,
    );
  }

  function routeStatic<api, context extends unknown[], env>(
    path: StaticElement<any>,
    api: api,
    ctx: Context<context>,
    d: Delayed<F, env, Server<F, Sub<StaticElement<any>, api>>>,
    codings: DeriveCoding<F, Sub<StaticElement<any>, api>>,
  ): Router<env, Http<F, F>> {
    return pathRouter(path.path, route(api, ctx, d, codings));
  }

  function routeVerbContent<
    context extends unknown[],
    env,
    M extends string,
    CT extends ContentTypeWithMime<M>,
    A,
  >(
    verb: Verb<any, CT, Type<any, A>>,
    ctx: Context<context>,
    d: Delayed<F, env, Server<F, Verb<any, CT, Type<any, A>>>>,
    codings: DeriveCoding<F, Verb<any, CT, Type<any, A>>>,
  ): Router<env, Http<F, F>> {
    const { encode } = codings[verb.contentType.mime][verb.body.ref];
    const acceptCheck = DelayedCheck.withRequest(F)(req =>
      EitherT(
        F.pure(
          req.headers
            .get(Accept.Select)
            .map(ah =>
              ah.mediaRanges.any(mr =>
                mr.satisfiedBy(verb.contentType.self.mediaType),
              )
                ? Either.rightUnit
                : Left(new ParsingFailure('Invalid content type')),
            )
            .fold(() => Either.rightUnit, id),
        ),
      ),
    );

    return leafRouter(verb.method, env =>
      Kleisli(req => {
        const run = d
          .addAcceptCheck(EF)(acceptCheck)
          .runDelayed(EF)(env)(req)
          .flatten(F);

        return run.fold(F)(
          f => f.toHttpResponse(req.httpVersion),
          e =>
            new Response<F>(verb.status, req.httpVersion)
              .withEntity(encode(e), EntityEncoder.text())
              .putHeaders(verb.contentType.self),
        );
      }),
    );
  }

  function routeVerbNoContent<context extends unknown[], env>(
    verb: VerbNoContent<any>,
    ctx: Context<context>,
    d: Delayed<F, env, Server<F, VerbNoContent<any>>>,
    codings: DeriveCoding<F, VerbNoContent<any>>,
  ): Router<env, Http<F, F>> {
    return leafRouter(verb.method, env =>
      Kleisli(req => {
        const run = d.runDelayed(EF)(env)(req).flatten(F);
        return run.fold(F)(
          f => f.toHttpResponse(req.httpVersion),
          () =>
            new Response<F>(Status.NoContent).withHttpVersion(req.httpVersion),
        );
      }),
    );
  }

  return route;
}
