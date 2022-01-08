import { Schema } from '@fp4ts/schema';
import { ContentType } from './content-types';
import { ElementBase } from './element-base';

export class ReqBodyElement<Cts extends ContentType[], A> extends ElementBase {
  public constructor(
    public readonly contentType: Cts,
    public readonly sa: Schema<A>,
  ) {
    super();
  }
}

export const ReqBody = <Cts extends ContentType[], A>(
  contentTypes: Cts,
  sa: Schema<A>,
): ReqBodyElement<Cts, A> => new ReqBodyElement(contentTypes, sa);
