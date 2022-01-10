/* eslint-disable @typescript-eslint/ban-types */
import { Either, EitherT, Kleisli, Left, Monad, Option } from '@fp4ts/cats';
import { id, Kind } from '@fp4ts/core';
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
  ApiElement,
  VerbNoContent,
  CaptureElement,
  QueryElement,
  StaticElement,
  CaptureTag,
  StaticTag,
  QueryTag,
  VerbNoContentTag,
  VerbTag,
  Verb,
} from '@fp4ts/http-dsl-shared/lib/api';
import { Type } from '@fp4ts/http-dsl-shared/lib/type';
import { Context, EmptyContext } from './context';
import { Delayed } from './delayed';
import { DelayedCheck } from './delayed-check';
import { HandlerK } from './handler';
import {
  CaptureRouter,
  choice,
  leafRouter,
  pathRouter,
  Router,
  runRouterEnv,
} from './router';

export const toApp =
  <F>(F: Monad<F>) =>
  <api>(
    api: api,
    server: Server<F, api>,
    codings: DeriveCoding<F, api>,
  ): HttpApp<F> =>
    HttpRoutes.orNotFound(F)(toHttpRoutes(F)(api, server, codings));

export const toHttpRoutes =
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

    return leafRouter(env =>
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
    return leafRouter(env =>
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

export interface TermDerivates<F, api, m> {}
export interface SubDerivates<F, x, api, m> {}

export interface CodingDerivates<F, x, z> {}

type Server<F, api> = ServerT<F, api, HandlerK>;

// prettier-ignore
type ServerT<F, api, m> =
  api extends Sub<infer x, infer api>
    ? DeriveSub<F, x, api, m>
  : api extends Alt<infer xs>
    ? { [k in keyof xs]: ServerT<F, xs[k], m> }
  : DeriveTerm<F, api, m>;

// prettier-ignore
type DeriveSub<F, x, api, m> =
  x extends ApiElement<infer T>
    ? T extends keyof SubDerivates<F, any, any, m>
      ? SubDerivates<F, x, api, m>[T]
      : never
    : never;

// prettier-ignore
type DeriveTerm<F, api, m> =
  api extends ApiElement<infer T>
    ? T extends keyof TermDerivates<F, any, m>
      ? TermDerivates<F, api, m>[T]
      : never
    : never;

// prettier-ignore
export type DeriveCoding<F, api, z = {}> =
  api extends Sub<infer x, infer api>
    ? DeriveCoding<F, api, DeriveTermCoding<F, x, z>>
  : api extends Alt<infer xs>
    ? DeriveAltCodings<F, xs, z>
  : DeriveTermCoding<F, api, z>;

// prettier-ignore
type DeriveTermCoding<F, api, z = {}> =
  api extends ApiElement<infer T>
    ? T extends keyof CodingDerivates<F, any, any>
      ? CodingDerivates<F, api, z>[T]
      : never
    : never;

// prettier-ignore
type DeriveAltCodings<F, xs extends unknown[], z = {}> =
  xs extends [infer x, ...infer xs]
    ? DeriveAltCodings<F, xs, DeriveCoding<F, x, z>>
    : z;

// -- Implementations

export interface TermDerivates<F, api, m> {
  [VerbTag]: api extends Verb<any, Type<any, infer A>>
    ? Kind<m, [F, A]>
    : never;
  [VerbNoContentTag]: Kind<m, [F, void]>;
}

export interface SubDerivates<F, x, api, m> {
  [CaptureTag]: x extends CaptureElement<any, infer T>
    ? T extends Type<any, infer X>
      ? (x: X) => ServerT<F, api, m>
      : never
    : never;
  [QueryTag]: x extends QueryElement<any, infer T>
    ? T extends Type<any, infer X>
      ? (x: Option<X>) => ServerT<F, api, m>
      : never
    : never;
  [StaticTag]: ServerT<F, api, m>;
}

interface Codable<A> {
  encode: (a: A) => string;
  decode: (a: string) => Either<MessageFailure, A>;
}

export interface CodingDerivates<F, x, z> {
  [CaptureTag]: x extends CaptureElement<any, infer T>
    ? T extends Type<infer R, infer A>
      ? z & { [k in R]: Codable<A> }
      : never
    : never;
  [QueryTag]: x extends QueryElement<any, infer T>
    ? T extends Type<infer R, infer A>
      ? z & { [k in R]: Codable<A> }
      : never
    : never;
  [StaticTag]: z;
  [VerbTag]: x extends Verb<any, infer T>
    ? T extends Type<infer R, infer A>
      ? z & { [k in R]: Codable<A> }
      : never
    : never;
  [VerbNoContentTag]: z;
}
