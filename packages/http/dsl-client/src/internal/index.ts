// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { id, pipe, TypeRef } from '@fp4ts/core';
import { Some } from '@fp4ts/cats';
import { Concurrent, IO } from '@fp4ts/effect';
import {
  Accept,
  Authorization,
  AuthScheme,
  ContentType,
  EntityEncoder,
  MediaRange,
  Method,
  Request,
  SelectHeader,
  Token,
} from '@fp4ts/http-core';
import { Client, DeriveCoding, OmitBuiltins } from '../type-level';
import {
  Alt,
  BasicAuthElement,
  CaptureAllElement,
  CaptureElement,
  ContentTypeWithMime,
  FromHttpApiDataTag,
  HeaderElement,
  HeadersElement,
  HeadersVerbElement,
  QueryElement,
  RawElement,
  RawHeaderElement,
  ReqBodyElement,
  StaticElement,
  Sub,
  ToHttpApiDataTag,
  VerbElement,
  VerbNoContentElement,
} from '@fp4ts/http-dsl-shared';
import { ClientM } from '../client-m';
import { ResponseHeaders } from '../headers';
import { builtins } from '../builtin-codables';

export const toClientIn =
  <F>(F: Concurrent<F, Error>) =>
  <api>(
    api: api,
    codings: OmitBuiltins<DeriveCoding<F, api>>,
  ): Client<F, api> =>
    clientWithRoute(F)(api, id, merge(builtins, codings));

export const toIOClientIn = toClientIn(IO.Concurrent);

const merge = (xs: any, ys: any): any => {
  const zs = {} as Record<string, any>;
  for (const k in xs) {
    zs[k] = { ...zs[k], ...xs[k], ...ys[k] };
  }
  for (const k in ys) {
    zs[k] = { ...zs[k], ...xs[k], ...ys[k] };
  }
  return zs;
};

export function clientWithRoute<F>(F: Concurrent<F, Error>) {
  function clientWithRoute<api>(
    api: api,
    br: (req: Request<F>) => Request<F>,
    codings: DeriveCoding<F, api>,
  ): Client<F, api> {
    if (api instanceof Alt) {
      return routeAlt(api, br, codings) as any;
    }

    if (api instanceof Sub) {
      const { lhs, rhs } = api;

      if (lhs instanceof CaptureElement) {
        return routeCapture(lhs, rhs, br, codings as any) as any;
      }
      if (lhs instanceof QueryElement) {
        return routeQuery(lhs, rhs, br, codings as any) as any;
      }
      if (lhs instanceof StaticElement) {
        return routeStatic(lhs, rhs, br, codings as any) as any;
      }
      if (lhs instanceof HeaderElement) {
        return routeHeader(lhs, rhs, br, codings as any) as any;
      }
      if (lhs instanceof RawHeaderElement) {
        return routeRawHeader(lhs, rhs, br, codings as any) as any;
      }
      if (lhs instanceof ReqBodyElement) {
        return routeReqBody(lhs, rhs, br, codings as any) as any;
      }
      if (lhs instanceof CaptureAllElement) {
        return routeCaptureAll(lhs, rhs, br, codings as any) as any;
      }
      if (lhs instanceof BasicAuthElement) {
        return routeBasicAuth(lhs, rhs, br, codings as any) as any;
      }
    }

    if (api instanceof VerbElement) {
      return routeVerbContent(api, br, codings) as any;
    }

    if (api instanceof HeadersVerbElement) {
      return routeHeadersVerbContent(api, br, codings as any) as any;
    }

    if (api instanceof VerbNoContentElement) {
      return routeVerbNoContent(api, br, codings as any) as any;
    }

    if (api instanceof RawElement) {
      return routeRaw(api, br) as any;
    }

    throw new Error('Invalid API');
  }

  function routeAlt<xs extends [unknown, ...unknown[]]>(
    api: Alt<xs>,
    br: (req: Request<F>) => Request<F>,
    codings: DeriveCoding<F, Alt<xs>>,
  ): Client<F, Alt<xs>> {
    return api.xs.map((x: any) => clientWithRoute(x, br, codings)) as any;
  }

  function routeCapture<api, A>(
    a: CaptureElement<string, TypeRef<any, A>>,
    api: api,
    br: (req: Request<F>) => Request<F>,
    codings: DeriveCoding<F, Sub<CaptureElement<any, TypeRef<any, A>>, api>>,
  ): Client<F, Sub<CaptureElement<any, TypeRef<any, A>>, api>> {
    const C = codings[ToHttpApiDataTag][a.type.Ref];
    return element =>
      clientWithRoute(
        api,
        req =>
          br(req).transformUri(uri => uri['/'](C.toPathComponent(element))),
        codings,
      );
  }

  function routeQuery<api, A>(
    a: QueryElement<string, TypeRef<any, A>>,
    api: api,
    br: (req: Request<F>) => Request<F>,
    codings: DeriveCoding<F, Sub<QueryElement<any, TypeRef<any, A>>, api>>,
  ): Client<F, Sub<QueryElement<any, TypeRef<any, A>>, api>> {
    const C = codings[ToHttpApiDataTag][a.type.Ref];
    return element =>
      clientWithRoute(
        api,
        element.fold(
          () => br,
          element => req =>
            br(req).transformUri(uri =>
              uri['&+'](a.property, Some(C.toQueryParameter(element))),
            ),
        ),
        codings,
      );
  }

  function routeStatic<api>(
    a: StaticElement<string>,
    api: api,
    br: (req: Request<F>) => Request<F>,
    codings: DeriveCoding<F, Sub<StaticElement<string>, api>>,
  ): Client<F, Sub<StaticElement<string>, api>> {
    return clientWithRoute(
      api,
      req => br(req).transformUri(uri => uri['/'](a.path)),
      codings,
    );
  }

  function routeHeader<api, G, A>(
    a: HeaderElement<SelectHeader<G, A>>,
    api: api,
    br: (req: Request<F>) => Request<F>,
    codings: DeriveCoding<F, Sub<HeaderElement<SelectHeader<G, A>>, api>>,
  ): Client<F, Sub<HeaderElement<SelectHeader<G, A>>, api>> {
    return h =>
      clientWithRoute(
        api,
        h.fold(
          () => br,
          h => req => br(req).putHeaders(...a.header.toRaw(h)),
        ),
        codings,
      );
  }

  function routeRawHeader<api, H extends string, A>(
    a: RawHeaderElement<H, TypeRef<any, A>>,
    api: api,
    br: (req: Request<F>) => Request<F>,
    codings: DeriveCoding<F, Sub<RawHeaderElement<H, TypeRef<any, A>>, api>>,
  ): Client<F, Sub<RawHeaderElement<H, TypeRef<any, A>>, api>> {
    const C = codings[ToHttpApiDataTag][a.type.Ref];
    return h =>
      clientWithRoute(
        api,
        h.fold(
          () => br,
          h => req => br(req).putHeaders([a.key, C.toHeader(h)]),
        ),
        codings,
      );
  }

  function routeBasicAuth<api>(
    a: BasicAuthElement<any, any>,
    api: api,
    br: (req: Request<F>) => Request<F>,
    codings: DeriveCoding<F, Sub<BasicAuthElement<any, any>, api>>,
  ): Client<F, Sub<BasicAuthElement<any, any>, api>> {
    return creds =>
      clientWithRoute(
        api,
        req =>
          br(req).putHeaders(
            ...new Authorization(
              new Token(AuthScheme.Basic, creds.token),
            ).toRaw(),
          ),
        codings,
      );
  }

  function routeReqBody<
    api,
    A,
    M extends string,
    CT extends ContentTypeWithMime<M>,
  >(
    a: ReqBodyElement<CT, TypeRef<any, A>>,
    api: api,
    br: (req: Request<F>) => Request<F>,
    codings: DeriveCoding<F, Sub<ReqBodyElement<CT, TypeRef<any, A>>, api>>,
  ): Client<F, Sub<ReqBodyElement<CT, TypeRef<any, A>>, api>> {
    const C = codings[a.ct.mime][a.body.Ref];
    return b =>
      clientWithRoute(
        api,
        req =>
          br(req)
            .withEntity(C.encode(b), EntityEncoder.text())
            .putHeaders(...ContentType.Header.parse(a.ct.mime).get.toRaw()),
        codings,
      );
  }

  function routeCaptureAll<api, R extends string, A>(
    a: CaptureAllElement<any, TypeRef<R, A>>,
    api: api,
    br: (req: Request<F>) => Request<F>,
    codings: DeriveCoding<F, Sub<CaptureAllElement<any, TypeRef<R, A>>, api>>,
  ): Client<F, Sub<CaptureAllElement<any, TypeRef<R, A>>, api>> {
    const C = codings[ToHttpApiDataTag][a.type.Ref];
    return es =>
      clientWithRoute(
        api,
        req =>
          br(req).transformUri(uri =>
            es.foldLeft(uri, (uri, e) => uri['/'](C.toPathComponent(e))),
          ),
        codings,
      );
  }

  function routeVerbContent<
    M extends string,
    R extends string,
    CT extends ContentTypeWithMime<M>,
    T extends TypeRef<R, any>,
  >(
    verb: VerbElement<any, CT, T>,
    br: (req: Request<F>) => Request<F>,
    codings: DeriveCoding<F, VerbElement<any, CT, T>>,
  ): Client<F, VerbElement<any, CT, T>> {
    const C = codings[verb.contentType.mime][verb.body.Ref];
    const accept = MediaRange.fromString(verb.contentType.mime).get;
    return req =>
      ClientM(underlying => {
        const req_ = br(req)
          .putHeaders(...new Accept(accept).toRaw())
          .withMethod(verb.method);
        return underlying.fetch(req_, res => {
          if (!res.status.isSuccessful)
            return pipe(
              res.bodyText.compileConcurrent(F).string,
              F.flatMap(txt =>
                F.throwError(
                  new Error(`Failed with status ${res.status.code}\n${txt}`),
                ),
              ),
            );

          if (
            !res.contentType
              .map(ct => ct.mediaType.satisfiedBy(accept))
              .getOrElse(() => true)
          ) {
            return F.throwError(new Error('Unsupported media type'));
          }

          return F.flatMap_(res.bodyText.compileConcurrent(F).string, txt =>
            F.fromEither(C.decode(txt)),
          );
        });
      });
  }

  function routeHeadersVerbContent<
    M extends string,
    R extends string,
    CT extends ContentTypeWithMime<M>,
    T extends TypeRef<R, any>,
    H extends HeadersElement<
      (HeaderElement<any> | RawHeaderElement<any, TypeRef<any, any>>)[],
      T
    >,
  >(
    verb: HeadersVerbElement<any, CT, H>,
    br: (req: Request<F>) => Request<F>,
    codings: DeriveCoding<F, VerbElement<any, CT, T>>,
  ): Client<F, VerbElement<any, CT, T>> {
    const C = codings[verb.contentType.mime][verb.headers.body.Ref];
    return req =>
      ClientM(underlying => {
        const req_ = br(req)
          .putHeaders(
            ...new Accept(
              MediaRange.fromString(verb.contentType.mime).get,
            ).toRaw(),
          )
          .withMethod(verb.method);

        return underlying.fetch(req_, res => {
          if (!res.status.isSuccessful)
            return F.throwError(
              new Error(`Failed with status ${res.status.code}`),
            );

          const hs: any[] = [];
          for (const h of verb.headers.headers) {
            if (h instanceof RawHeaderElement) {
              const hh = res.headers.getRaw(h.key);
              if (hh.isEmpty)
                return F.throwError(new Error(`Header '${h.key}' not present`));
              const C = (codings as any)[FromHttpApiDataTag][h.type.Ref];
              const h_ = C.parseHeader(hh.get.head);
              if (h_.isEmpty)
                return F.throwError(new Error(`Header '${h.key}' not present`));
              hs.push(h_.get);
            } else {
              const hh = res.headers.get(h.header);
              if (hh.isEmpty)
                return F.throwError(
                  new Error(
                    `Header '${h.header.header.headerName}' not present`,
                  ),
                );
              hs.push(hh.get);
            }
          }

          return pipe(
            res.bodyText.compileConcurrent(F).string,
            F.flatMap(txt => F.fromEither(C.decode(txt))),
            F.map(r => new ResponseHeaders(hs, r)),
          );
        });
      });
  }

  function routeVerbNoContent(
    verb: VerbNoContentElement<Method>,
    br: (req: Request<F>) => Request<F>,
    codings: DeriveCoding<F, VerbNoContentElement<any>>,
  ): Client<F, VerbNoContentElement<any>> {
    return req =>
      ClientM(underlying =>
        underlying.fetch(br(req).withMethod(verb.method), res =>
          res.status.isSuccessful
            ? F.unit
            : F.throwError(new Error(`Failed with status ${res.status.code}`)),
        ),
      );
  }

  function routeRaw(
    raw: RawElement,
    br: (req: Request<F>) => Request<F>,
  ): Client<F, RawElement> {
    return runRequest => runRequest(br(new Request()));
  }

  return clientWithRoute;
}
