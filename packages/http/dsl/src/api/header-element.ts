import { Header as HttpHeader } from '@fp4ts/http-core';
import { ElementBase } from './element-base';

export class HeaderElement<S extends string, A> extends ElementBase {
  public constructor(
    public readonly headerName: S,
    public readonly sa: HttpHeader<A, any>,
  ) {
    super();
  }
}

export const Header = <S extends string, A>(
  n: S,
  h: HttpHeader<A, any>,
): HeaderElement<S, A> => new HeaderElement(n, h);
