import { ElementBase } from './element-base';

export class PathElement<S extends string> extends ElementBase {
  public constructor(public readonly value: S) {
    super();
  }
}

export const Route = <S extends string>(s: S): PathElement<S> =>
  new PathElement(s);
