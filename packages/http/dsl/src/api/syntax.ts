import { Alt } from './alt';
import { Sub } from './sub';
import { PathElement } from './path-element';
import { ElementBase } from './element-base';

declare module './element-base' {
  interface ElementBase {
    ':>'<S extends string>(that: S): Sub<this, PathElement<S>>;
    ':>'<B>(that: B): Sub<this, B>;
  }
}

ElementBase.prototype[':>'] = function (that: any) {
  return typeof that === 'string'
    ? new Sub(this, new PathElement(that))
    : new Sub(this, that);
};

declare module './alt' {
  interface Alt<A, B> {
    ':>'<S extends string>(that: S): Sub<this, PathElement<S>>;
    ':>'<C>(that: C): Sub<this, C>;
  }
}

Alt.prototype[':>'] = function (that: any) {
  return typeof that === 'string'
    ? new Sub(this, new PathElement(that))
    : new Sub(this, that);
};

declare module './element-base' {
  interface ElementBase {
    '<|>'<B>(that: B): Alt<this, B>;
  }
}

ElementBase.prototype['<|>'] = function (that: any) {
  return new Alt(this, that);
};

declare module './sub' {
  interface Sub<A, B> {
    '<|>'<C>(that: C): Alt<this, C>;
  }
}

Sub.prototype['<|>'] = function (that: any) {
  return new Alt(this, that);
};
