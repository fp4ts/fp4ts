/* eslint-disable @typescript-eslint/ban-types */
import { id } from '@fp4ts/core';
import { Either, EitherT, Kleisli, Left, Monad } from '@fp4ts/cats';
import {
  Accept,
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
} from '@fp4ts/http-dsl-shared';
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
import { Server, DeriveCoding } from '../type-level';
import { builtins } from '../builtin-codables';

export const toApp =
  <F>(F: Monad<F>) =>
  <api>(
    api: api,
    server: Server<F, api>,
    codings: Omit<DeriveCoding<F, api>, keyof builtins>,
  ): HttpApp<F> =>
    HttpRoutes.orNotFound(F)(toHttpRoutes(F)(api, server, codings));

export const toHttpRoutes =
  <F>(F: Monad<F>) =>
  <api>(
    api: api,
    server: Server<F, api>,
    codings: Omit<DeriveCoding<F, api>, keyof builtins>,
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
  <F>(F: Monad<F>) =>
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

export function route<F>(F: Monad<F>) {
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
        return routeCapture(lhs, rhs, ctx, server as any, codings);
      }
      if (lhs instanceof QueryElement) {
        return routeQuery(lhs, rhs, ctx, server as any, codings);
      }
      if (lhs instanceof StaticElement) {
        return routeStatic(lhs, rhs, ctx, server, codings);
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
    const { decode } = codings[a.type.ref];
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
    const { decode } = codings[a.type.ref];
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

  function routeStatic<api, context extends unknown[], env>(
    path: StaticElement<any>,
    api: api,
    ctx: Context<context>,
    d: Delayed<F, env, Server<F, Sub<StaticElement<any>, api>>>,
    codings: DeriveCoding<F, Sub<StaticElement<any>, api>>,
  ): Router<env, Http<F, F>> {
    return pathRouter(path.path, route(api, ctx, d, codings));
  }

  function routeVerbContent<A, context extends unknown[], env>(
    verb: Verb<any, Type<any, A>>,
    ctx: Context<context>,
    d: Delayed<F, env, Server<F, Verb<any, Type<any, A>>>>,
    codings: DeriveCoding<F, Verb<any, Type<any, A>>>,
  ): Router<env, Http<F, F>> {
    const { encode } = codings[verb.body.ref];
    const acceptCheck = DelayedCheck.withRequest(F)(req =>
      EitherT(
        F.pure(
          req.headers
            .get(Accept.Select)
            .map(ah =>
              ah.mediaRanges.any(mr =>
                mr.satisfiedBy(verb.contentType.mediaType),
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
              .withEntity(encode(e), EntityEncoder.json())
              .putHeaders(verb.contentType),
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
