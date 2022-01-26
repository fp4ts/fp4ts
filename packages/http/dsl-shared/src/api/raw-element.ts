import { ApiElement, ElementTag } from './api-element';

export const RawElementTag = '@fp4ts/http/dsl-shared/raw';
export type RawElementTag = typeof RawElementTag;

export class RawElement implements ApiElement<RawElementTag> {
  [ElementTag]: RawElementTag;
}

export const Raw = new RawElement();
