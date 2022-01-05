// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Schema } from '@fp4ts/schema';
import {
  CaptureElement,
  EndpointContentElement,
  EndpointNoContentElement,
  HeaderParamElement,
  HeadersElement,
  PathElement,
  PayloadWithStatus,
  QueryElement,
  RequestBodyElement,
} from './api-element';
import { ApiList } from './api-list';
import { ApiGroup } from './api-group';
import { ContentType } from './content-type';
import { Method } from './method';

export const Root: ApiList<[]> = new ApiList([]);
export const Route = <S extends string>(s: S): PathElement<S> =>
  new PathElement(s);

export const Capture = Object.freeze({
  boolean: <K extends string>(key: K): CaptureElement<K, boolean> =>
    new CaptureElement(key, Schema.boolean),
  number: <K extends string>(key: K): CaptureElement<K, number> =>
    new CaptureElement(key, Schema.number),
  string: <K extends string>(key: K): CaptureElement<K, string> =>
    new CaptureElement(key, Schema.string),
});

export const Query = Object.freeze({
  boolean: <K extends string>(key: K): QueryElement<K, boolean> =>
    new QueryElement(key, Schema.boolean),
  number: <K extends string>(key: K): QueryElement<K, number> =>
    new QueryElement(key, Schema.number),
  string: <K extends string>(key: K): QueryElement<K, string> =>
    new QueryElement(key, Schema.string),
});

export const Header = <K extends string, A>(
  k: K,
  sa: Schema<A>,
): HeaderParamElement<K, A> => new HeaderParamElement(k, sa);
export const Headers = <HS extends HeaderParamElement<any, any>[]>(
  ...xs: HS
): HeadersElement<HS> => new HeadersElement(xs);

export const RequestBody = <A, CT extends ContentType>(
  body: Schema<A>,
  contentType: CT,
): RequestBodyElement<A, CT> => new RequestBodyElement(body, contentType);

export const group = <A extends unknown[]>(...xs: A): ApiGroup<A> =>
  new ApiGroup(xs);

export const Get = Endpoint('GET');
export const Post = Endpoint('POST');
export const Put = Endpoint('PUT');
export const Delete = Endpoint('DELETE');
export const GetNoContent = EndpointNoContent('GET');
export const PostNoContent = EndpointNoContent('POST');
export const PutNoContent = EndpointNoContent('PUT');
export const DeleteNoContent = EndpointNoContent('DELETE');

export function Endpoint<M extends Method>(m: M) {
  function curried<A, CT extends [ContentType, ...ContentType[]]>(
    cts: CT,
    sa: Schema<A>,
  ): EndpointContentElement<M, CT, [], A, 200>;

  function curried<
    A,
    CT extends [ContentType, ...ContentType[]],
    H extends HeaderParamElement<any, any>,
  >(
    cts: CT,
    serverHeader: H,
    sa: Schema<A>,
  ): EndpointContentElement<M, CT, [H], A, 200>;

  function curried<
    A,
    CT extends [ContentType, ...ContentType[]],
    HS extends HeaderParamElement<any, any>[],
  >(
    cts: CT,
    serverHeaders: HS,
    sa: Schema<A>,
  ): EndpointContentElement<M, CT, HS, A, 200>;

  function curried<
    CT extends [ContentType, ...ContentType[]],
    A,
    S extends number,
  >(
    cts: CT,
    body: PayloadWithStatus<A, S>,
  ): EndpointContentElement<M, CT, [], A, S>;

  function curried<
    CT extends [ContentType, ...ContentType[]],
    H extends HeaderParamElement<any, any>,
    A,
    S extends number,
  >(
    cts: CT,
    serverHeader: H,
    body: PayloadWithStatus<A, S>,
  ): EndpointContentElement<M, CT, [H], A, S>;

  function curried<
    CT extends [ContentType, ...ContentType[]],
    HS extends HeaderParamElement<any, any>[],
    A,
    S extends number,
  >(
    cts: CT,
    serverHeaders: HeadersElement<HS>,
    body: PayloadWithStatus<A, S>,
  ): EndpointContentElement<M, CT, HS, A, S>;

  function curried(...xs: any): any {
    if (xs.length === 3) {
      const [cts, hs0, x] = xs;
      const hs = hs0 instanceof HeadersElement ? hs0.hs : [hs0];
      if (x instanceof PayloadWithStatus)
        return new EndpointContentElement(m, cts, hs, x.body, x.status);
      return new EndpointContentElement(m, cts, [], x, 200);
    } else {
      const [cts, x] = xs;
      if (x instanceof PayloadWithStatus)
        return new EndpointContentElement(m, cts, [], x.body, x.status);
      return new EndpointContentElement(m, cts, [], x, 200);
    }
  }

  return curried;
}

export function EndpointNoContent<M extends Method>(m: M) {
  function curried<H extends HeaderParamElement<any, any>>(
    hs: H,
  ): EndpointNoContentElement<M, [H]>;
  function curried<HS extends HeaderParamElement<any, any>[]>(
    hs: HeadersElement<HS>,
  ): EndpointNoContentElement<M, HS>;
  function curried(): EndpointNoContentElement<M, []>;
  function curried(x?: any): any {
    if (x instanceof HeadersElement)
      return new EndpointNoContentElement(m, x.hs);
    if (x instanceof HeaderParamElement)
      return new EndpointNoContentElement(m, [x]);
    return new EndpointNoContentElement(m, []);
  }

  return curried;
}

export const WithStatus = <A, S extends number>(
  sa: Schema<A>,
  status: S,
): PayloadWithStatus<A, S> => new PayloadWithStatus(sa, status);
