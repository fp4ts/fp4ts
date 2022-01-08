import { Schema } from '@fp4ts/schema';
import { ElementBase } from './element-base';
import { HeaderElement } from './header-element';

export class ResponseHeadersElement<
  HS extends HeaderElement<any, any>[],
  A,
> extends ElementBase {
  public constructor(public readonly hs: HS, public readonly sa: Schema<A>) {
    super();
  }
}

export const Headers = <HS extends HeaderElement<any, any>[], A>(
  hs: HS,
  sa: Schema<A>,
): ResponseHeadersElement<HS, A> => new ResponseHeadersElement(hs, sa);
