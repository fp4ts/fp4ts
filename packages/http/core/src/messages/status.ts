import { EntityEncoder } from '../codec';
import { Response } from './response';

export class Status {
  public static readonly Ok = new Status(200, 'OK');
  public static readonly Created = new Status(201, 'Created');

  public static readonly NotFound = new Status(404, 'Not Found');

  // eslint-disable-next-line prettier/prettier
  public static readonly InternalServerError = new Status(404, 'Internal Server Error');

  private readonly __void!: void;
  private constructor(
    public readonly code: number,
    public readonly name: string,
  ) {
    const f = buildResponse(this);
    return f as any;
  }
}

export interface Status {
  <A>(a: A): <F>(e: EntityEncoder<F, A>) => Response<F>;
}

const buildResponse =
  (s: Status) =>
  <A>(a: A) =>
  <F>(e: EntityEncoder<F, A>): Response<F> =>
    new Response<F>(s).withEntity(a, e);
