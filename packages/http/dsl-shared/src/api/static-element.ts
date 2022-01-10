import { ElementTag } from './api-element';
import { BaseElement } from './base-element';

export const StaticTag = '@fp4ts/http/dsl-shared/static';
export type StaticTag = typeof StaticTag;

export class StaticElement<P extends string> extends BaseElement<StaticTag> {
  public readonly [ElementTag] = StaticTag;
  public constructor(public readonly path: P) {
    super();
  }
}

export const Route = <P extends string>(path: P): StaticElement<P> =>
  new StaticElement(path);
