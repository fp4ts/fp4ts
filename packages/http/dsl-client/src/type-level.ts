// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/ban-types */
import { Kind, TypeOf } from '@fp4ts/core';
import { List, Option } from '@fp4ts/cats';
import { Method, Response, SelectHeader } from '@fp4ts/http-core';
import {
  Alt,
  ApiElement,
  CaptureElement,
  CaptureTag,
  QueryElement,
  QueryTag,
  ReqBodyElement,
  ReqBodyTag,
  StaticTag,
  Sub,
  VerbElement,
  VerbNoContentTag,
  VerbTag,
  FromHttpApiDataTag,
  FromHttpApiData,
  HeaderTag,
  HeaderElement,
  RawHeaderTag,
  RawHeaderElement,
  HeadersVerbTag,
  HeadersVerbElement,
  HeadersElement,
  ToHttpApiDataTag,
  ToHttpApiData,
  RawElementTag,
  CaptureAllElementTag,
  CaptureAllElement,
} from '@fp4ts/http-dsl-shared';
import { Headers } from './headers';
import { builtins } from './builtin-codables';
import { Codable } from './codable';
import { ClientMF } from './client-m';

export interface TermDerivates<F, api, m> {}
export interface SubDerivates<F, x, api, m> {}

export interface CodingDerivates<F, x, z> {}

export type Client<F, api> = ClientT<F, api, ClientMF>;

// prettier-ignore
export type ClientT<F, api, m> =
  api extends Sub<infer x, infer api>
    ? DeriveSub<F, x, api, m>
  : api extends Alt<infer xs>
    ? { [k in keyof xs]: ClientT<F, xs[k], m> }
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
  :  DeriveTermCoding<F, api, z>;

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

// prettier-ignore
export interface TermDerivates<F, api, m> {
  [VerbTag]: api extends VerbElement<any, any, infer T>
    ? Kind<m, [F, TypeOf<T>]>
    : never;
  [HeadersVerbTag]: api extends HeadersVerbElement<any, any, HeadersElement<infer hs, infer T>>
    ? Kind<m, [F, BuildHeaders<hs, TypeOf<T>>]>
    : never;
  [VerbNoContentTag]: Kind<m, [F, void]>;
  [RawElementTag]: (m: Method) => Kind<m, [F, Response<F>]>,
}

// prettier-ignore
type BuildHeaders<xs, a, hs extends unknown[] = []> =
  xs extends []
    ? Headers<hs, a>
  : xs extends [...infer xs, RawHeaderElement<any, infer h>]
    ? BuildHeaders<xs, a, [...hs, TypeOf<h>]>
  : xs extends [...infer xs, HeaderElement<SelectHeader<infer f, infer aa>>]
    ? BuildHeaders<xs, a, [...hs, Kind<f, [aa]>]>
  : never;

export interface SubDerivates<F, x, api, m> {
  [CaptureTag]: x extends CaptureElement<any, infer T>
    ? (x: TypeOf<T>) => ClientT<F, api, m>
    : never;
  [QueryTag]: x extends QueryElement<any, infer T>
    ? (x: Option<TypeOf<T>>) => ClientT<F, api, m>
    : never;
  [StaticTag]: ClientT<F, api, m>;
  [ReqBodyTag]: x extends ReqBodyElement<any, infer T>
    ? (a: TypeOf<T>) => ClientT<F, api, m>
    : never;
  [HeaderTag]: x extends HeaderElement<infer H>
    ? H extends SelectHeader<infer G, infer A>
      ? (h: Option<Kind<G, [A]>>) => ClientT<F, api, m>
      : never
    : never;
  [RawHeaderTag]: x extends RawHeaderElement<any, infer T>
    ? (h: Option<TypeOf<T>>) => ClientT<F, api, m>
    : never;
  // prettier-ignore
  [CaptureAllElementTag]: x extends CaptureAllElement<any, infer T>
    ? (xs: List<TypeOf<T>>) => ClientT<F, api, m>
    : never;
}

export interface CodingDerivates<F, x, z> {
  [CaptureTag]: x extends CaptureElement<any, infer T>
    ? z & {
        [ToHttpApiDataTag]: { [k in T['Ref']]: ToHttpApiData<TypeOf<T>> };
      }
    : never;
  [QueryTag]: x extends QueryElement<any, infer T>
    ? z & {
        [ToHttpApiDataTag]: { [k in T['Ref']]: ToHttpApiData<TypeOf<T>> };
      }
    : never;
  [CaptureAllElementTag]: x extends CaptureAllElement<any, infer T>
    ? z & {
        [ToHttpApiDataTag]: { [k in T['Ref']]: ToHttpApiData<TypeOf<T>> };
      }
    : never;
  [StaticTag]: z;
  [VerbTag]: x extends VerbElement<any, infer CT, infer T>
    ? z & { [_ in CT['mime']]: { [k in T['Ref']]: Codable<TypeOf<T>> } }
    : never;
  // prettier-ignore
  [HeadersVerbTag]: x extends HeadersVerbElement<any, infer CT, infer H>
    ? H extends HeadersElement<infer hs, infer T>
      ? z & { [_ in CT['mime']]: { [k in T['Ref']]: Codable<TypeOf<T>> } }
          & { [FromHttpApiDataTag]: ExtractResponseHeaderCodings<hs>; }
      : never
    : never;
  [VerbNoContentTag]: z;
  [ReqBodyTag]: x extends ReqBodyElement<infer CT, infer T>
    ? z & { [_ in CT['mime']]: { [k in T['Ref']]: Codable<TypeOf<T>> } }
    : never;
  [HeaderTag]: z;
  [RawHeaderTag]: x extends RawHeaderElement<any, infer T>
    ? z & {
        [ToHttpApiDataTag]: { [k in T['Ref']]: ToHttpApiData<TypeOf<T>> };
      }
    : never;
  [RawElementTag]: z;
}

// prettier-ignore
type ExtractResponseHeaderCodings<hs, acc = {}> =
  hs extends []
    ? acc
  : hs extends [HeaderElement<any>, ...infer hs]
    ? ExtractResponseHeaderCodings<hs, acc>
  : hs extends [RawHeaderElement<any, infer T>, ...infer hs]
    ? ExtractResponseHeaderCodings<hs, acc & { [_ in T['Ref']]: FromHttpApiData<TypeOf<T>> }>
  : never;

// prettier-ignore
export type OmitBuiltins<Provided> =
  { [k in keyof Provided]:
      k extends keyof builtins
        ? Omit<Provided[k], keyof builtins[k]>
        : Provided[k]
  };
