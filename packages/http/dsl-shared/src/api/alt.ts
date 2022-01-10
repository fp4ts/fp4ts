import { ApiElement, ElementTag } from './api-element';

export const AltTag = '@fp4ts/http/dsl-shared/alt';
export type AltTag = typeof AltTag;

export class Alt<A extends unknown[]> implements ApiElement<AltTag> {
  public readonly [ElementTag] = AltTag;
  public constructor(public readonly xs: A) {}
}

export const group = <A extends unknown[]>(...xs: A): Alt<A> => new Alt(xs);
