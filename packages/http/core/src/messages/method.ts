// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Either, Option } from '@fp4ts/cats';
import { ParsingFailure } from './message-failure';

export class Method {
  public static readonly ACL: Method = new Method('ACL');
  public static readonly 'BASELINE-CONTROL': Method = new Method(
    'BASELINE-CONTROL',
  );
  public static readonly BIND: Method = new Method('BIND');
  public static readonly CHECKIN: Method = new Method('CHECKIN');
  public static readonly CHECKOUT: Method = new Method('CHECKOUT');
  public static readonly CONNECT: Method = new Method('CONNECT');
  public static readonly COPY: Method = new Method('COPY');
  public static readonly DELETE: Method = new Method('DELETE');
  public static readonly GET: Method = new Method('GET');
  public static readonly HEAD: Method = new Method('HEAD');
  public static readonly LABEL: Method = new Method('LABEL');
  public static readonly LINK: Method = new Method('LINK');
  public static readonly LOCK: Method = new Method('LOCK');
  public static readonly MERGE: Method = new Method('MERGE');
  public static readonly MKACTIVITY: Method = new Method('MKACTIVITY');
  public static readonly MKCALENDAR: Method = new Method('MKCALENDAR');
  public static readonly MKCOL: Method = new Method('MKCOL');
  public static readonly MKREDIRECTREF: Method = new Method('MKREDIRECTREF');
  public static readonly MKWORKSPACE: Method = new Method('MKWORKSPACE');
  public static readonly MOVE: Method = new Method('MOVE');
  public static readonly OPTIONS: Method = new Method('OPTIONS');
  public static readonly ORDERPATCH: Method = new Method('ORDERPATCH');
  public static readonly PATCH: Method = new Method('PATCH');
  public static readonly POST: Method = new Method('POST');
  public static readonly PRI: Method = new Method('PRI');
  public static readonly PROPFIND: Method = new Method('PROPFIND');
  public static readonly PROPPATCH: Method = new Method('PROPPATCH');
  public static readonly PUT: Method = new Method('PUT');
  public static readonly REBIND: Method = new Method('REBIND');
  public static readonly REPORT: Method = new Method('REPORT');
  public static readonly SEARCH: Method = new Method('SEARCH');
  public static readonly TRACE: Method = new Method('TRACE');
  public static readonly UNBIND: Method = new Method('UNBIND');
  public static readonly UNCHECKOUT: Method = new Method('UNCHECKOUT');
  public static readonly UNLINK: Method = new Method('UNLINK');
  public static readonly UNLOCK: Method = new Method('UNLOCK');
  public static readonly UPDATE: Method = new Method('UPDATE');
  public static readonly UPDATEREDIRECTREF: Method = new Method(
    'UPDATEREDIRECTREF',
  );
  public static readonly 'VERSION-CONTROL': Method = new Method(
    'VERSION-CONTROL',
  );

  public static fromString(s: string): Either<ParsingFailure, Method> {
    return Option(this.all.find(m => m.methodName === s)).toRight(
      () => new ParsingFailure(`Invalid method name ${s}`),
    );
  }

  public static unsafeFromString(s: string): Method {
    return this.fromString(s).get;
  }

  public static readonly all: Method[] = [
    this.ACL,
    this['BASELINE-CONTROL'],
    this.BIND,
    this.CHECKIN,
    this.CHECKOUT,
    this.CONNECT,
    this.COPY,
    this.DELETE,
    this.GET,
    this.HEAD,
    this.LABEL,
    this.LINK,
    this.LOCK,
    this.MERGE,
    this.MKACTIVITY,
    this.MKCALENDAR,
    this.MKCOL,
    this.MKREDIRECTREF,
    this.MKWORKSPACE,
    this.MOVE,
    this.OPTIONS,
    this.ORDERPATCH,
    this.PATCH,
    this.POST,
    this.PRI,
    this.PROPFIND,
    this.PROPPATCH,
    this.PUT,
    this.REBIND,
    this.REPORT,
    this.SEARCH,
    this.TRACE,
    this.UNBIND,
    this.UNCHECKOUT,
    this.UNLINK,
    this.UNLOCK,
    this.UPDATE,
    this.UPDATEREDIRECTREF,
    this['VERSION-CONTROL'],
  ];

  private readonly __void!: void;
  private constructor(public readonly methodName: string) {}
}
