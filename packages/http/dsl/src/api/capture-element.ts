import { Schema } from '@fp4ts/schema';
import { ElementBase } from './element-base';

export class CaptureElement<S extends string, A> extends ElementBase {
  public constructor(public readonly name: S, public readonly sa: Schema<A>) {
    super();
  }
}

export const Capture = Object.freeze({
  boolean: <S extends string>(name: S): CaptureElement<S, boolean> =>
    new CaptureElement(name, Schema.boolean),
  number: <S extends string>(name: S): CaptureElement<S, number> =>
    new CaptureElement(name, Schema.number),
  string: <S extends string>(name: S): CaptureElement<S, string> =>
    new CaptureElement(name, Schema.string),
});
