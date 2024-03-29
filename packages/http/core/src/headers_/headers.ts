// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Option } from '@fp4ts/cats';
import { List, NonEmptyList, OrdSet } from '@fp4ts/collections';
import { RawHeader, SelectHeader, ToRaw } from '../header';
import { Authorization } from './authorization';

export class Headers {
  public static readonly empty: Headers = new Headers(List.empty);

  public static fromToRaw(...hs: ToRaw[]): Headers {
    return new Headers(List.fromArray(hs).flatMap(this.convertToRaw));
  }

  public static get sensitive(): OrdSet<string> {
    return OrdSet(Authorization.Header.headerName);
  }

  public constructor(public readonly headers: List<RawHeader>) {}

  public transform(f: (hs: List<RawHeader>) => List<RawHeader>): Headers {
    return new Headers(f(this.headers));
  }

  public get<F, A>(sh: SelectHeader<F, A>): Option<Kind<F, [A]>> {
    return sh.from(this.headers).flatMap(r => r.toOption);
  }

  public getRaw(key: string): Option<NonEmptyList<string>> {
    return this.headers
      .filter(x => x.headerName.toLowerCase() === key.toLowerCase())
      .map(x => x.headerValue).toNel;
  }

  public put(...hs: ToRaw[]): Headers {
    return this['+++'](Headers.fromToRaw(...hs));
  }

  public '+++'(that: Headers): Headers {
    return this.concat(that);
  }
  public concat(that: Headers): Headers {
    if (this.headers.isEmpty) return that;
    else if (that.headers.isEmpty) return this;
    else {
      const s = new Set<string>();
      that.headers.forEach(rh => s.add(rh.headerName));
      return new Headers(
        this.headers.filter(h => !s.has(h.headerName))['++'](that.headers),
      );
    }
  }

  public redactSensitive(
    isSensitive: (hn: string) => boolean = hn => Headers.sensitive.contains(hn),
  ): Headers {
    return this.transform(hs =>
      hs.map(h =>
        isSensitive(h.headerName)
          ? new RawHeader(h.headerName, '<REDACTED>')
          : h,
      ),
    );
  }

  private static convertToRaw = (h: ToRaw): List<RawHeader> => {
    if (typeof h === 'object' && 'toRaw' in h) {
      return h.toRaw().toList;
    }
    if (Array.isArray(h) && h.length === 2) {
      return List(new RawHeader(h[0], h[1]));
    }
    if (h instanceof RawHeader) {
      return List(h);
    }
    throw new Error('Unreachable');
  };
}
