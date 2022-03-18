// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/ban-types */
import { Kind, TypeOf } from '@fp4ts/core';
import { List, Option } from '@fp4ts/cats';
import { HttpApp, SelectHeader } from '@fp4ts/http-core';
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
  BasicAuthTag,
  BasicAuthElement,
} from '@fp4ts/http-dsl-shared';
import { BasicAuthenticator } from '@fp4ts/http-server';
import { AddHeader } from './add-header';
import { builtins } from './builtin-codables';
import { HandlerF } from './internal/handler';
import { BasicAuthValidatorTag } from './basic-auth-validator';
import { Codec } from '@fp4ts/schema';

export interface TermDerivates<F, api, m> {}
export interface SubDerivates<F, x, api, m> {}

export interface CodingDerivates<F, x, z> {}

export type Server<F, api> = ServerT<F, api, HandlerF>;

// prettier-ignore
export type ServerT<F, api, m> =
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
    ? Kind<m, [F, AddHeaders<hs, TypeOf<T>>]>
    : never;
  [VerbNoContentTag]: Kind<m, [F, void]>;
  [RawElementTag]: HttpApp<F>,
}

// prettier-ignore
type AddHeaders<hs, a> =
  hs extends []
    ? a
  : hs extends [...infer hs, RawHeaderElement<any, infer h>]
    ? AddHeaders<hs, AddHeader<TypeOf<h>, a>>
  : hs extends [...infer hs, HeaderElement<SelectHeader<infer f, infer aa>>]
    ? AddHeaders<hs, AddHeader<Kind<f, [aa]>, a>>
  : never;

export interface SubDerivates<F, x, api, m> {
  [CaptureTag]: x extends CaptureElement<any, infer T>
    ? (x: TypeOf<T>) => ServerT<F, api, m>
    : never;
  [QueryTag]: x extends QueryElement<any, infer T>
    ? (x: Option<TypeOf<T>>) => ServerT<F, api, m>
    : never;
  [StaticTag]: ServerT<F, api, m>;
  [ReqBodyTag]: x extends ReqBodyElement<any, infer T>
    ? (a: TypeOf<T>) => ServerT<F, api, m>
    : never;
  [HeaderTag]: x extends HeaderElement<infer H>
    ? H extends SelectHeader<infer G, infer A>
      ? (h: Option<Kind<G, [A]>>) => ServerT<F, api, m>
      : never
    : never;
  [RawHeaderTag]: x extends RawHeaderElement<any, infer T>
    ? (h: Option<TypeOf<T>>) => ServerT<F, api, m>
    : never;
  // prettier-ignore
  [CaptureAllElementTag]: x extends CaptureAllElement<any, infer T>
    ? (xs: List<TypeOf<T>>) => ServerT<F, api, m>
    : never;
  [BasicAuthTag]: x extends BasicAuthElement<any, infer T>
    ? (userData: TypeOf<T>) => ServerT<F, api, m>
    : never;
}

export interface CodingDerivates<F, x, z> {
  [CaptureTag]: x extends CaptureElement<any, infer T>
    ? z & {
        [FromHttpApiDataTag]: { [k in T['Ref']]: FromHttpApiData<TypeOf<T>> };
      }
    : never;
  [QueryTag]: x extends QueryElement<any, infer T>
    ? z & {
        [FromHttpApiDataTag]: { [k in T['Ref']]: FromHttpApiData<TypeOf<T>> };
      }
    : never;
  [CaptureAllElementTag]: x extends CaptureAllElement<any, infer T>
    ? z & {
        [FromHttpApiDataTag]: { [k in T['Ref']]: FromHttpApiData<TypeOf<T>> };
      }
    : never;
  [StaticTag]: z;
  [VerbTag]: x extends VerbElement<any, infer CT, infer T>
    ? z & {
        [_ in CT['mime']]: {
          [k in T['Ref']]: Codec<string, string, TypeOf<T>>;
        };
      }
    : never;
  // prettier-ignore
  [HeadersVerbTag]: x extends HeadersVerbElement<any, infer CT, infer H>
    ? H extends HeadersElement<infer hs, infer T>
      ? z & { [_ in CT['mime']]: { [k in T['Ref']]: Codec<string, string, TypeOf<T>> } }
          & { [ToHttpApiDataTag]: ExtractResponseHeaderCodings<hs>; }
      : never
    : never;
  [VerbNoContentTag]: z;
  [ReqBodyTag]: x extends ReqBodyElement<infer CT, infer T>
    ? z & {
        [_ in CT['mime']]: {
          [k in T['Ref']]: Codec<string, string, TypeOf<T>>;
        };
      }
    : never;
  [HeaderTag]: z;
  [RawHeaderTag]: x extends RawHeaderElement<any, infer T>
    ? z & {
        [FromHttpApiDataTag]: { [k in T['Ref']]: FromHttpApiData<TypeOf<T>> };
      }
    : never;
  [RawElementTag]: z;
  [BasicAuthTag]: x extends BasicAuthElement<infer N, infer T>
    ? z & {
        [BasicAuthValidatorTag]: { [k in N]: BasicAuthenticator<F, TypeOf<T>> };
      }
    : never;
}

// prettier-ignore
type ExtractResponseHeaderCodings<hs, acc = {}> =
  hs extends []
    ? acc
  : hs extends [HeaderElement<any>, ...infer hs]
    ? ExtractResponseHeaderCodings<hs, acc>
  : hs extends [RawHeaderElement<any, infer T>, ...infer hs]
    ? ExtractResponseHeaderCodings<hs, acc & { [_ in T['Ref']]: ToHttpApiData<TypeOf<T>> }>
  : never;

// prettier-ignore
export type OmitBuiltins<Provided> =
  { [k in keyof Provided]:
      k extends keyof builtins
        ? Omit<Provided[k], keyof builtins[k]>
        : Provided[k]
  };
