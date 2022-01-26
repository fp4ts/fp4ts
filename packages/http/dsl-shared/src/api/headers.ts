import { HeaderElement, RawHeaderElement } from './header-element';
import { Type } from '../type';

export class HeadersElement<
  H extends (HeaderElement<any> | RawHeaderElement<any, any>)[],
  A extends Type<any, any>,
> {
  public constructor(public readonly headers: H, public readonly body: A) {}
}

export const Headers =
  <H extends (HeaderElement<any> | RawHeaderElement<any, any>)[]>(
    ...headers: H
  ) =>
  <A extends Type<any, any>>(body: A): HeadersElement<H, A> =>
    new HeadersElement(headers, body);
