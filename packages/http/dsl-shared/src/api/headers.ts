import { HeaderElement, RawHeaderElement } from './header-element';
import { Type } from '../type';

export class HeadersElement<
  H extends (HeaderElement<any> | RawHeaderElement<any, any>)[],
  A extends Type<any, any>,
> {
  public constructor(public readonly headers: H, public readonly body: A) {}
}

export function Headers<
  H extends (HeaderElement<any> | RawHeaderElement<any, any>)[],
  A extends Type<any, any>,
>(headers: H, body: A): HeadersElement<H, A> {
  return new HeadersElement(headers, body);
}
