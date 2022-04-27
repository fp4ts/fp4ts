// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { tupled } from '@fp4ts/core';
import {
  Either,
  Left,
  List,
  Map,
  Monoid,
  None,
  Option,
  Right,
  Some,
  Vector,
  Writer,
} from '@fp4ts/cats';
import { ParsingFailure } from './message-failure';

export function uri(strings: TemplateStringsArray, ...xs: any[]): Uri {
  let acc: string = '';
  let i = 0;
  let j = 0;
  while (i < strings.length && j < xs.length) {
    acc += strings[i++];
    acc += xs[j++];
  }
  while (i < strings.length) {
    acc += strings[i++];
  }
  while (j < xs.length) {
    acc += `${xs[j++]}`;
  }
  return Uri.unsafeFromString(acc);
}
export function path(strings: TemplateStringsArray, ...xs: any[]): Path {
  let acc: string = '';
  let i = 0;
  let j = 0;
  while (i < strings.length && j < xs.length) {
    acc += strings[i++];
    acc += xs[j++];
  }
  while (i < strings.length) {
    acc += strings[i++];
  }
  while (j < xs.length) {
    acc += `${xs[j++]}`;
  }
  return Path.fromString(acc);
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
    public readonly fragment: Option<string> = None,
  ) {}

  public copy({
    scheme = this.scheme,
    authority = this.authority,
    path = this.path,
    query = this.query,
    fragment = this.fragment,
  }: Partial<UriProps>): Uri {
    return new Uri(scheme, authority, path, query, fragment);
  }

  public withScheme(scheme: Scheme): Uri {
    return this.copy({ scheme: Some(scheme) });
  }

  public withPath(path: Path): Uri {
    return this.copy({ path });
  }

  public withQuery(query: Query): Uri {
    return this.copy({ query });
  }

  public appendSegment(segment: string): Uri {
    return new Uri(
      this.scheme,
      this.authority,
      this.path.append(segment),
      this.query,
    );
  }
  public '/'(segment: string): Uri {
    return this.appendSegment(segment);
  }

  public appendQuery(k: string, v: Option<string>): Uri {
    return new Uri(
      this.scheme,
      this.authority,
      this.path,
      this.query.append(k, v),
    );
  }
  public '&+'(k: string, v: Option<string>): Uri {
    return this.appendQuery(k, v);
  }

  public render(): Writer<string, void> {
    const w = Writer.pure(undefined);
    const scheme = this.scheme.fold(
      () => w,
      s => Writer([`${s}://`, undefined as void]),
    );

    return Writer.pure(undefined)
      .productR(scheme)
      .productR(this.authority.map(a => a.render()).getOrElse(() => w))
      .productR(
        this.path !== Path.empty && !this.path.isAbsolute
          ? Writer.tell('/').productR(this.path.render())
          : this.path.render(),
      )
      .productR(this.query.render())
      .tell(this.fragment.map(f => `#${f}`).getOrElse(() => ''));
  }

  public toString(): string {
    return this.render().runWriter()[0].folding(Monoid.string);
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
    if (m[6]) {
      const q = Query.fromString(m[7] ?? '');
      if (q.isRight) {
        query = q.get;
      } else {
        return q as any as Either<ParsingFailure, Uri>;
      }
    }
    let fragment: Option<string> = None;
    if (m[8]) {
      fragment = Some(m[9] ?? '');
    }
    return Right(new Uri(scheme, authority, path, query, fragment));
  }

  public static unsafeFromString(s: string): Uri {
    return this.fromString(s).get;
  }
}

type UriProps = {
  readonly scheme: Option<Scheme>;
  readonly authority: Option<Authority>;
  readonly path: Path;
  readonly query: Query;
  readonly fragment: Option<string>;
};

export class Authority {
  public constructor(
    public readonly host: string = 'localhost',
    public readonly port: Option<number> = None,
  ) {}

  public copy({
    host = this.host,
    port = this.port,
  }: Partial<AuthorityProps>): Authority {
    return new Authority(host, port);
  }

  public render(): Writer<string, void> {
    const w = Writer<string, void>([this.host, undefined]);
    return this.port.fold(
      () => w,
      p => w.log(`:${p}`),
    );
  }

  public static fromString(s: string): Either<ParsingFailure, Authority> {
    const matches = Option(s.match(AUTHORITY_REGEX));
    return matches
      .map(m => new Authority(m[1] ?? undefined, Option(m[3]).map(parseInt)))
      .toRight(() => new ParsingFailure('Malformed authority'));
  }
}
type AuthorityProps = {
  readonly host: string;
  readonly port: Option<number>;
};

export class Path {
  public constructor(public readonly components: string[]) {}

  public get isAbsolute(): boolean {
    return this.components[0] === '';
  }

  public append(segment: string): Path {
    return this === Path.empty
      ? Path.Root.append(segment)
      : new Path([...this.components, segment]);
  }

  public render(): Writer<string, void> {
    return this === Path.Root
      ? Writer.tell('/')
      : Writer.tell(this.components.join('/'));
  }

  public toString(): string {
    return this.render().runWriter(Monoid.string)[0];
  }

  public startsWith(that: Path): boolean {
    return this.components.length < that.components.length
      ? false
      : this.components.join('/').startsWith(that.components.join('/'));
  }

  public static readonly empty: Path = new Path([]);
  public static readonly Root: Path = new Path(['']);

  public static fromString(s: string): Path {
    if (s === '') return Path.empty;
    if (s === '/') return Path.Root;
    const components = s.split('/');
    return new Path(components);
  }
}
export interface Path {
  '/'(segment: string): Path;
}
Path.prototype['/'] = Path.prototype.append;

export class Query {
  private constructor(private readonly xs: Vector<[string, Option<string>]>) {}

  public get params(): Map<string, string> {
    return this.xs
      .collect(([k, v]) => v.map(v => tupled(k, v)))
      .foldLeft(Map.empty as Map<string, string>, (m, [k, v]) =>
        m.insertWith(k, v, fst => fst),
      );
  }

  public get multiParams(): Map<string, List<string>> {
    return this.xs.foldLeft(
      Map.empty as Map<string, List<string>>,
      (m, [k, v]) =>
        m.insertWith(
          k,
          v.map(List).getOrElse(() => List.empty),
          (xs, ys) => xs['+++'](ys),
        ),
    );
  }

  public lookup(k: string): Option<Option<string>> {
    return this.xs.lookup(k);
  }

  public lookupAll(k: string): List<Option<string>> {
    return this.xs.collect(([kk, v]) => (kk === k ? Some(v) : None)).toList;
  }

  public append(k: string, v: Option<string>): Query {
    return new Query(this.xs.append([k, v]));
  }
  public '&+'(k: string, v: Option<string>): Query {
    return this.append(k, v);
  }

  public toString(): string {
    return this.render().runWriter(Monoid.string)[0];
  }

  public render(): Writer<string, void> {
    let isFirst = true;
    return this.xs.foldLeft(Writer.pure(undefined), (w, [k, ov]) => {
      const sep = isFirst ? '?' : '&';
      isFirst = false;
      const value = ov.fold(
        () => encodeURI(k),
        v => `${encodeURI(k)}=${encodeURI(v)}`,
      );
      return w.log(sep).log(value);
    });
  }

  public static readonly empty: Query = new Query(Vector.empty);

  public static fromString(s: string): Either<ParsingFailure, Query> {
    if (s === '') return Right(new Query(Vector(['', None])));
    const components = s
      .split('&')
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
      });

    return components.length === 0
      ? Right(new Query(Vector(['', None])))
      : Right(Query.fromEntries(components));
  }

  public static unsafeFromString(value: string): Query {
    return this.fromString(value).get;
  }

  public static fromEntries(es: [string, Option<string>][]): Query {
    return new Query(Vector.fromArray(es));
  }

  public static fromPairs(...es: [string, string][]): Query {
    return new Query(Vector.fromArray(es.map(([k, v]) => tupled(k, Some(v)))));
  }
}

// -- Regexes

const URI_REGEX =
  /^(([^:\/?#]+):\/\/)?(([^\/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?$/;

const AUTHORITY_REGEX = /^([^:]+)?(:(\d+)?)?$/;
