// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  Either,
  Left,
  List,
  Monoid,
  None,
  Option,
  Right,
  Some,
  Vector,
  Writer,
} from '@fp4ts/cats';
import { tupled } from '@fp4ts/core';
import { ParsingFailure } from './message-failure';

export function uri(strings: TemplateStringsArray, ...xs: any[]): Uri {
  const results: string[] = [];
  let i = 0;
  let j = 0;
  while (i < strings.length && j < xs.length) {
    results.push(strings[i++]);
    results.push(xs[j++]);
  }
  while (i < strings.length) {
    results.push(strings[i++]);
  }
  while (j < xs.length) {
    results.push(`${xs[j++]}`);
  }
  return Uri.fromStringUnsafe(results.join(''));
}

export type Scheme = 'http' | 'https';

export class Uri {
  public static get Root(): Uri {
    return new Uri(None, None, new Path(['']));
  }

  private readonly __void!: void;
  public constructor(
    public readonly scheme: Option<Scheme> = None,
    public readonly authority: Option<Authority> = None,
    public readonly path: Path = Path.empty,
    public readonly query: Query = Query.empty,
  ) {}

  public render(M: Monoid<string>): Writer<string, void> {
    const w = Writer.unit(M);
    const scheme = this.scheme.fold(
      () => w,
      s => Writer([`${s}://`, undefined as void]),
    );

    return Writer.unit(M)
      .productR(M)(scheme)
      .productR(M)(this.authority.map(a => a.render(M)).getOrElse(() => w))
      .productR(M)(this.path.render(M))
      .productR(M)(this.query.render(M));
  }

  public static fromString(s: string): Either<ParsingFailure, Uri> {
    // This is very nasty and highly procedural, but performant
    const m = s.match(URI_REGEX);
    if (!m) return Left(new ParsingFailure('Malformed URI'));

    let scheme: Option<Scheme> = None;
    if (m[2]) {
      const s = m[2];
      if (s === 'http' || s === 'https') {
        scheme = Option(s);
      } else {
        return Left(new ParsingFailure(`Unsupported scheme ${s}`));
      }
    }

    let authority: Option<Authority> = None;
    if (m[4]) {
      const a = Authority.fromString(m[4]);
      if (a.isRight) {
        authority = Some(a.get);
      } else {
        return a as any as Either<ParsingFailure, Uri>;
      }
    }

    let path = Path.empty;
    if (m[5]) {
      path = Path.fromString(m[5]);
    }

    let query = Query.empty;
    if (m[7]) {
      const q = Query.fromString(m[7]);
      if (q.isRight) {
        query = q.get;
      } else {
        return q as any as Either<ParsingFailure, Uri>;
      }
    }
    return Right(new Uri(scheme, authority, path, query));
  }

  public static fromStringUnsafe(s: string): Uri {
    return this.fromString(s).get;
  }
}

export class Authority {
  public constructor(
    public readonly host: string = 'localhost',
    public readonly port: Option<number> = None,
  ) {}

  public render(M: Monoid<string>): Writer<string, void> {
    const w = Writer<string, void>([this.host, undefined]);
    return this.port.fold(
      () => w,
      p => w['<<<'](M)(`:${p}`),
    );
  }

  public static fromString(s: string): Either<ParsingFailure, Authority> {
    const matches = Option(s.match(AUTHORITY_REGEX));
    return matches
      .map(m => new Authority(m[1] ?? undefined, Option(m[3]).map(parseInt)))
      .toRight(() => new ParsingFailure('Malformed authority'));
  }
}

export class Path {
  public constructor(public readonly components: readonly string[]) {}

  public render(M: Monoid<string>): Writer<string, void> {
    return Writer<string, void>([`${this.components.join('/')}`, undefined]);
  }

  public static readonly empty: Path = new Path([]);

  public static fromString(s: string): Path {
    if (s === '') return Path.empty;
    const components = s.split('/');
    return new Path(components);
  }
}

export class Query {
  private constructor(private readonly xs: Vector<[string, Option<string>]>) {}

  public lookup(k: string): Option<Option<string>> {
    return this.xs.lookup(k);
  }

  public lookupAll(k: string): List<Option<string>> {
    return this.xs.collect(([kk, v]) => (kk === k ? Some(v) : None)).toList;
  }

  public render(M: Monoid<string>): Writer<string, void> {
    const isFirst = true;
    return this.xs.foldLeft(Writer.unit(M), (w, [k, ov]) => {
      const sep = isFirst ? '?' : '&';
      const value = ov.fold(
        () => encodeURI(k),
        v => `${encodeURI(k)}=${encodeURI(v)}`,
      );
      return w['<<<'](M)(sep)['<<<'](M)(value);
    });
  }

  public static readonly empty: Query = new Query(Vector.empty);

  public static fromString(s: string): Either<ParsingFailure, Query> {
    const components = s.split('&');

    return Right(
      Query.fromEntries(
        components
          .filter(s => s !== '')
          .map(s => {
            const xs = s.split('=');
            if (xs.length === 1) {
              return tupled(decodeURI(xs[0]), None);
            } else {
              return tupled(
                decodeURI(xs[0]),
                Some(decodeURI(xs.slice(1).join('='))),
              );
            }
          }),
      ),
    );
  }

  public static fromEntries(es: [string, Option<string>][]): Query {
    return new Query(Vector.fromArray(es));
  }
}

// -- Regexes

const URI_REGEX =
  /^(([^:\/?#]+):\/\/)?(([^\/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?$/;

const SCHEME_REGEX = /^(https?)$/;

const AUTHORITY_REGEX = /^([^:]+)?(:(\d+))?$/;
