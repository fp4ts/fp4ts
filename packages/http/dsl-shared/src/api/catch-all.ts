import { ApiElement, ElementTag } from './api-element';

export const CatchAllElementTag = '@fp4ts/http/dsl-shared/catch-all';
export type CatchAllElementTag = typeof CatchAllElementTag;

export class CatchAllElement implements ApiElement<CatchAllElementTag> {
  [ElementTag]: CatchAllElementTag;
}

export const CatchAll = new CatchAllElement();
