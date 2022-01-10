import { StaticElement } from './static-element';
import { BaseElement } from './base-element';
import { Sub } from './sub';

declare module './base-element' {
  interface BaseElement<T extends string> {
    ':>'<S extends string>(that: S): Sub<this, StaticElement<S>>;
    ':>'<B>(that: B): Sub<this, B>;
  }
}

BaseElement.prototype[':>'] = function (this: any, that: any) {
  return typeof that === 'string'
    ? new Sub(this, new StaticElement(that))
    : new Sub(this, that);
} as any;
