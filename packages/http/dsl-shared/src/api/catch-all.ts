import { BaseElement } from '.';
import { Type } from '../type';
import { ApiElement, ElementTag } from './api-element';

export const CaptureAllElementTag = '@fp4ts/http/dsl-shared/capture-all';
export type CaptureAllElementTag = typeof CaptureAllElementTag;

export class CaptureAllElement<
  T extends Type<any, any>,
> extends BaseElement<CaptureAllElementTag> {
  [ElementTag]: CaptureAllElementTag;

  public constructor(public readonly type: T) {
    super();
  }
}

export const CaptureAll = <T extends Type<any, any>>(
  type: T,
): CaptureAllElement<T> => new CaptureAllElement(type);
