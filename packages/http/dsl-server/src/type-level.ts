// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/ban-types */
import { Option } from '@fp4ts/cats';
import { Kind } from '@fp4ts/core';
import { HttpApp, Path, SelectHeader } from '@fp4ts/http-core';
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
  Type,
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
  CatchAllElementTag,
} from '@fp4ts/http-dsl-shared';
import { AddHeader } from './add-header';
import { builtins } from './builtin-codables';
import { Codable } from './codable';
import { HandlerK } from './internal/handler';

export interface TermDerivates<F, api, m> {}
export interface SubDerivates<F, x, api, m> {}

export interface CodingDerivates<F, x, z> {}

export type Server<F, api> = ServerT<F, api, HandlerK>;

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

// prettier-ignore
export interface TermDerivates<F, api, m> {
  [VerbTag]: api extends VerbElement<any, any, Type<any, infer A>>
    ? Kind<m, [F, A]>
    : never;
  [HeadersVerbTag]: api extends HeadersVerbElement<any, any, HeadersElement<infer hs, Type<any, infer A>>>
    ? Kind<m, [F, AddHeaders<hs, A>]>
    : never;
  [VerbNoContentTag]: Kind<m, [F, void]>;
  [RawElementTag]: HttpApp<F>,
}

// prettier-ignore
type AddHeaders<hs, a> =
  hs extends []
    ? a
  : hs extends [...infer hs, RawHeaderElement<any, Type<any, infer h>>]
    ? AddHeaders<hs, AddHeader<h, a>>
  : hs extends [...infer hs, HeaderElement<SelectHeader<infer f, infer aa>>]
    ? AddHeaders<hs, AddHeader<Kind<f, [aa]>, a>>
  : never;

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
  [ReqBodyTag]: x extends ReqBodyElement<any, infer T>
    ? T extends Type<any, infer A>
      ? (a: A) => ServerT<F, api, m>
      : never
    : never;
  [HeaderTag]: x extends HeaderElement<infer H>
    ? H extends SelectHeader<infer G, infer A>
      ? (h: Option<Kind<G, [A]>>) => ServerT<F, api, m>
      : never
    : never;
  [RawHeaderTag]: x extends RawHeaderElement<any, infer T>
    ? T extends Type<any, infer A>
      ? (h: Option<A>) => ServerT<F, api, m>
      : never
    : never;
  [CatchAllElementTag]: (path: Path) => ServerT<F, api, m>;
}

export interface CodingDerivates<F, x, z> {
  [CaptureTag]: x extends CaptureElement<any, infer T>
    ? T extends Type<infer R, infer A>
      ? z & { [FromHttpApiDataTag]: { [k in R]: FromHttpApiData<A> } }
      : never
    : never;
  [QueryTag]: x extends QueryElement<any, infer T>
    ? T extends Type<infer R, infer A>
      ? z & { [FromHttpApiDataTag]: { [k in R]: FromHttpApiData<A> } }
      : never
    : never;
  [StaticTag]: z;
  [VerbTag]: x extends VerbElement<any, infer CT, infer T>
    ? T extends Type<infer R, infer A>
      ? z & { [_ in CT['mime']]: { [k in R]: Codable<A> } }
      : never
    : never;
  // prettier-ignore
  [HeadersVerbTag]: x extends HeadersVerbElement<any, infer CT, infer H>
    ? H extends HeadersElement<infer hs, Type<infer R, infer A>>
      ? z & { [_ in CT['mime']]: { [k in R]: Codable<A> } }
          & { [ToHttpApiDataTag]: ExtractResponseHeaderCodings<hs>; }
      : never
    : never;
  [VerbNoContentTag]: z;
  [ReqBodyTag]: x extends ReqBodyElement<infer CT, infer T>
    ? T extends Type<infer R, infer A>
      ? z & { [_ in CT['mime']]: { [k in R]: Codable<A> } }
      : never
    : never;
  [HeaderTag]: z;
  [RawHeaderTag]: x extends RawHeaderElement<any, infer T>
    ? T extends Type<infer R, infer A>
      ? z & { [FromHttpApiDataTag]: { [k in R]: FromHttpApiData<A> } }
      : never
    : never;
}

// prettier-ignore
type ExtractResponseHeaderCodings<hs, acc = {}> =
  hs extends []
    ? acc
  : hs extends [HeaderElement<any>, ...infer hs]
    ? ExtractResponseHeaderCodings<hs, acc>
  : hs extends [RawHeaderElement<any, Type<infer R, infer A>>, ...infer hs]
    ? ExtractResponseHeaderCodings<hs, acc & { [_ in R]: ToHttpApiData<A> }>
  : never;

// prettier-ignore
export type OmitBuiltins<Provided> =
  OmitEmpty<{ [k in keyof Provided]:
      k extends keyof builtins
        ? Omit<Provided[k], keyof builtins[k]>
        : Provided[k]
  }>;

type OmitEmpty<X> = Omit<
  X,
  { [k in keyof X]: {} extends X[k] ? k : never }[keyof X]
>;
