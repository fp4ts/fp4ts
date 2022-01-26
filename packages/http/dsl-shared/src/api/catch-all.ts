import { Type } from '../type';
import { BaseElement } from './base-element';
import { ElementTag } from './api-element';

export const CaptureAllElementTag = '@fp4ts/http/dsl-shared/capture-all';
export type CaptureAllElementTag = typeof CaptureAllElementTag;

export class CaptureAllElement<
  S extends string,
  T extends Type<any, any>,
> extends BaseElement<CaptureAllElementTag> {
  [ElementTag]: CaptureAllElementTag;

  public constructor(public readonly name: S, public readonly type: T) {
    super();
  }
}

export const CaptureAll = <S extends string, T extends Type<any, any>>(
  name: S,
  type: T,
): CaptureAllElement<S, T> => new CaptureAllElement(name, type);
