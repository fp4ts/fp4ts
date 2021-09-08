import { Identity } from './algebra';
import { flatMap_, flatTap_, flatten, map_, tap_ } from './operators';

declare module './algebra' {
  interface Identity<A> {
    map<B>(f: (a: A) => B): Identity<B>;
    tap(f: (a: A) => unknown): Identity<A>;
    flatMap<B>(f: (a: A) => Identity<B>): Identity<B>;
    flatTap(f: (a: A) => Identity<unknown>): Identity<A>;
    flatten: A extends Identity<infer B> ? Identity<B> : never | unknown;
  }
}

Identity.prototype.map = function <A, B>(
  this: Identity<A>,
  f: (a: A) => B,
): Identity<B> {
  return map_(this, f);
};

Identity.prototype.tap = function <A>(
  this: Identity<A>,
  f: (a: A) => unknown,
): Identity<A> {
  return tap_(this, f);
};

Identity.prototype.flatMap = function <A, B>(
  this: Identity<A>,
  f: (a: A) => Identity<B>,
): Identity<B> {
  return flatMap_(this, f);
};

Identity.prototype.flatMap = function <A, B>(
  this: Identity<A>,
  f: (a: A) => Identity<B>,
): Identity<B> {
  return flatMap_(this, f);
};

Identity.prototype.flatTap = function <A>(
  this: Identity<A>,
  f: (a: A) => Identity<unknown>,
): Identity<unknown> {
  return flatTap_(this, f);
};

Object.defineProperty(Identity.prototype, 'flatten', {
  get<A>(this: Identity<Identity<A>>): Identity<A> {
    return flatten(this);
  },
});
