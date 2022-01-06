// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Either, None, Option, OrderedMap, Some, Try } from '@fp4ts/cats';

export type Scheme = 'http' | 'https';

export class Uri {
  public static get Root(): Uri {
    return new Uri(None, None, new Path(['/']));
  }

  private readonly __void!: void;
  public constructor(
    public readonly scheme: Option<Scheme> = None,
    public readonly authority: Option<Authority> = None,
    public readonly path: Path = Path.empty,
    public readonly query: Query = Query.empty,
  ) {}

  public static fromString(s: string): Either<Error, Uri> {
    return Try(() => new URL(s)).map(url => {
      return new Uri(
        Some(url.protocol as Scheme),
        Some(new Authority(url.hostname, parseIntOption(url.port))),
        Path.fromString(url.pathname),
        Query.fromEntries([...url.searchParams.entries()]),
      );
    }).toEither;
  }

  public static fromStringUnsafe(s: string) {
    return this.fromString(s).get;
  }
}

export class Authority {
  public constructor(
    public readonly host: string = 'localhost',
    public readonly port: Option<number> = None,
  ) {}
}

export class Path {
  public constructor(public readonly components: string[]) {}

  public static readonly empty: Path = new Path([]);

  public startsWith(s: string): boolean {
    const components = s.split('/').slice(1);
    return components.every((c, idx) => c === this.components[idx]);
  }

  public static fromString(s: string): Path {
    const components = s.split('/').slice(1);
    return new Path(components);
  }
}

export class Query {
  public static readonly empty: Query = null as any;

  public static fromEntries(es: [string, string][]): Query {
    return OrderedMap(...es);
  }
}

const parseIntOption = (s: string, radix: number = 10): Option<number> => {
  const n = parseInt(s, radix);
  return Number.isNaN(n) ? None : Some(n);
};
