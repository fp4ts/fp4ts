/* eslint-disable @typescript-eslint/ban-types */
import { Either, Option } from '@fp4ts/cats';
import { $, $type, instance, Kind, TyK, TyVar } from '@fp4ts/core';
import {
  Alt,
  Sub,
  ApiElement,
  ElementTag,
  Verb,
  CaptureElement,
  QueryElement,
  StaticElement,
  BaseElement,
  CaptureTag,
  StaticTag,
  QueryTag,
  Route,
  Get,
  group,
  VerbTag,
} from '@fp4ts/http-dsl-shared/lib/api';
import { Type } from '@fp4ts/http-dsl-shared/lib/type';

interface HandlerK extends TyK<[unknown]> {
  [$type]: () => Response;
}

export declare function serve<api>(
  api: api,
  server: Server<api>,
  condigs: DeriveCoding<api>,
): void;

export interface TermDerivates<api, m> {}
export interface SubDerivates<x, api, m> {}

export interface CodingDerivates<x, z> {}

type Server<api> = ServerT<api, HandlerK>;

// prettier-ignore
type ServerT<api, m> =
  api extends Sub<infer x, infer api>
    ? DeriveSub<x, api, m>
  : api extends Alt<infer xs>
    ? { [k in keyof xs]: ServerT<xs[k], m> }
  : DeriveTerm<api, m>;

// prettier-ignore
type DeriveSub<x, api, m> =
  x extends ApiElement<infer T>
    ? T extends keyof SubDerivates<any, any, m>
      ? SubDerivates<x, api, m>[T]
      : never
    : never;

// prettier-ignore
type DeriveTerm<api, m> =
  api extends ApiElement<infer T>
    ? T extends keyof TermDerivates<any, m>
      ? TermDerivates<api, m>[T]
      : never
    : never;

// prettier-ignore
export type DeriveCoding<api, z = {}> =
  api extends Sub<infer x, infer api>
    ? DeriveCoding<api, DeriveTermCoding<x, z>>
  : api extends Alt<infer xs>
    ? DeriveAltCodings<xs, z>
  : DeriveTermCoding<api, z>;

// prettier-ignore
type DeriveTermCoding<api, z = {}> =
  api extends ApiElement<infer T>
    ? T extends keyof CodingDerivates<any, any>
      ? CodingDerivates<api, z>[T]
      : never
    : never;

// prettier-ignore
type DeriveAltCodings<xs extends unknown[], z = {}> =
  xs extends [infer x, ...infer xs]
    ? DeriveAltCodings<xs, DeriveCoding<x, z>>
    : z;

// -- Implementations

export interface TermDerivates<api, m> {
  [VerbTag]: () => Response;
}

export interface SubDerivates<x, api, m> {
  [CaptureTag]: x extends CaptureElement<any, infer T>
    ? T extends Type<any, infer X>
      ? (x: X) => ServerT<api, m>
      : never
    : never;
  [QueryTag]: x extends QueryElement<any, infer T>
    ? T extends Type<any, infer X>
      ? (x: Option<X>) => ServerT<api, m>
      : never
    : never;
  [StaticTag]: ServerT<api, m>;
}

export interface CodingDerivates<x, z> {
  [CaptureTag]: x extends CaptureElement<any, infer T>
    ? T extends Type<infer R, infer A>
      ? z & { [k in R]: (u: unknown) => Either<Error, A> }
      : never
    : never;
  [QueryTag]: x extends QueryElement<any, infer T>
    ? T extends Type<infer R, infer A>
      ? z & { [k in R]: (u: unknown) => Either<Error, A> }
      : never
    : never;
  [StaticTag]: z;
  [VerbTag]: z;
}
