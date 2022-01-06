// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Schema } from '@fp4ts/schema';
import { ContentType } from './content-type';
import { Method } from './method';

export type ApiElement =
  | PathElement<any>
  | CaptureElement<any, any>
  | QueryElement<any, any>
  | HeaderParamElement<any, any>
  | HeadersElement<any>
  | RequestBodyElement<any, any>
  | EndpointContentElement<any, any, any, any, any>
  | EndpointNoContentElement<any, any>;

export abstract class ApiElementBase {
  private readonly __void!: void;
}

export class PathElement<P extends string> extends ApiElementBase {
  public readonly tag = 'path';
  public constructor(public readonly segment: P) {
    super();
  }
}

export class CaptureElement<K extends string, V> extends ApiElementBase {
  public readonly tag = 'capture';
  public constructor(public readonly key: K, public readonly value: Schema<V>) {
    super();
  }
}

export class QueryElement<K extends string, V> extends ApiElementBase {
  public readonly tag = 'query';
  public constructor(public readonly key: K, public readonly value: Schema<V>) {
    super();
  }
}

export class HeaderParamElement<K extends string, V> extends ApiElementBase {
  public readonly tag = 'header-param';
  public constructor(public readonly key: K, public readonly value: Schema<V>) {
    super();
  }
}

export class HeadersElement<
  HS extends HeaderParamElement<any, any>[],
> extends ApiElementBase {
  public readonly tag = 'headers';
  public constructor(public readonly hs: HS) {
    super();
  }
}

export class RequestBodyElement<
  A,
  CT extends ContentType,
> extends ApiElementBase {
  public readonly tag = 'request-body';
  public constructor(
    public readonly body: Schema<A>,
    public readonly contentType: CT,
  ) {
    super();
  }
}

export class EndpointContentElement<
  M extends Method,
  CT extends ContentType[],
  HS extends HeaderParamElement<any, any>[],
  A,
  S extends number,
> extends ApiElementBase {
  public readonly tag = 'endpoint-content';
  public constructor(
    public readonly method: M,
    public readonly contentType: CT,
    public readonly serverHeaders: HS,
    public readonly body: Schema<A>,
    public readonly status: S,
  ) {
    super();
  }
}

export class PayloadWithStatus<A, S extends number> {
  public constructor(
    public readonly body: Schema<A>,
    public readonly status: S,
  ) {}
}

export class EndpointNoContentElement<
  M extends Method,
  HS extends HeaderParamElement<any, any>[],
> extends ApiElementBase {
  public readonly tag = 'endpoint-no-content';
  public constructor(
    public readonly method: M,
    public readonly serverHeaders: HS,
  ) {
    super();
  }
}
