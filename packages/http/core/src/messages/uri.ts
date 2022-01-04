import { None, Option } from '@fp4ts/cats';

export type Scheme = 'http' | 'https';

export class Uri {
  public static readonly Root: Uri = null as any;

  private readonly __void!: void;
  public constructor(
    public readonly scheme: Option<Scheme> = None,
    public readonly authority: Option<Authority> = None,
    public readonly path: Path = Path.empty,
    public readonly query: Query = Query.empty,
  ) {}
}

export class Authority {
  public constructor(
    public readonly host: string = 'localhost',
    public readonly port: Option<number> = None,
  ) {}
}

export class Path {
  public static readonly empty: Path = null as any;
}

export class Query {
  public static readonly empty: Query = null as any;
}
