import { State } from './algebra';
import { get, set, modify, update, updateAndGet } from './constructors';
import {
  flatMap_,
  flatTap_,
  flatten,
  map2_,
  mapState_,
  map_,
  productL_,
  productR_,
  product_,
  runState_,
  tap_,
} from './operators';

declare module './algebra' {
  interface State<S, A> {
    readonly get: State<S, S>;
    set(s: S): State<S, void>;
    update(f: (s: S) => S): State<S, void>;
    updateAndGet(f: (s: S) => S): State<S, S>;
    modify<B>(f: (s: S) => [S, B]): State<S, B>;

    mapState<B>(f: (s: S, a: A) => [S, B]): State<S, B>;

    map<B>(f: (a: A) => B): State<S, B>;
    tap(f: (a: A) => unknown): State<S, A>;

    map2<B>(fb: State<S, B>): <C>(f: (a: A, b: B) => C) => State<S, C>;

    product<B>(fb: State<S, B>): State<S, [A, B]>;

    productL<B>(fb: State<S, B>): State<S, A>;
    '<<<'<B>(fb: State<S, B>): State<S, A>;
    productR<B>(fb: State<S, B>): State<S, A>;
    '>>>'<B>(fb: State<S, B>): State<S, A>;

    flatMap<B>(f: (a: A) => State<S, B>): State<S, B>;
    flatTap(f: (a: A) => State<S, unknown>): State<S, A>;

    readonly flatten: A extends State<S, infer B>
      ? State<S, B>
      : never | unknown;

    runState(s: S): [S, A];
  }
}

Object.defineProperty(State.prototype, 'get', {
  get<S, A>(this: State<S, A>): State<S, S> {
    return get();
  },
});

State.prototype.set = function <S, A>(this: State<S, A>, s: S): State<S, void> {
  return set(s);
};

State.prototype.update = function <S, A>(
  this: State<S, A>,
  f: (s: S) => S,
): State<S, void> {
  return update(f);
};

State.prototype.updateAndGet = function <S, A>(
  this: State<S, A>,
  f: (s: S) => S,
): State<S, S> {
  return updateAndGet(f);
};

State.prototype.modify = function <S, A, B>(
  this: State<S, A>,
  f: (s: S) => [S, B],
): State<S, B> {
  return modify(f);
};

State.prototype.mapState = function <S, A, B>(
  this: State<S, A>,
  f: (s: S, a: A) => [S, B],
): State<S, B> {
  return mapState_(this, f);
};

State.prototype.map = function <S, A, B>(
  this: State<S, A>,
  f: (a: A) => B,
): State<S, B> {
  return map_(this, f);
};

State.prototype.tap = function <S, A>(
  this: State<S, A>,
  f: (a: A) => unknown,
): State<S, unknown> {
  return tap_(this, f);
};

State.prototype.map2 = function <S, A, B>(
  this: State<S, A>,
  that: State<S, B>,
): <C>(f: (a: A, b: B) => C) => State<S, C> {
  return f => map2_(this, that, f);
};

State.prototype.product = function <S, A, B>(
  this: State<S, A>,
  that: State<S, B>,
): State<S, [A, B]> {
  return product_(this, that);
};

State.prototype.productL = function <S, A, B>(
  this: State<S, A>,
  that: State<S, B>,
): State<S, A> {
  return productL_(this, that);
};

State.prototype['<<<'] = State.prototype.productL;

State.prototype.productR = function <S, A, B>(
  this: State<S, A>,
  that: State<S, B>,
): State<S, B> {
  return productR_(this, that);
};
State.prototype['>>>'] = State.prototype.productR;

State.prototype.flatMap = function <S, A, B>(
  this: State<S, A>,
  f: (a: A) => State<S, B>,
): State<S, B> {
  return flatMap_(this, f);
};

State.prototype.flatTap = function <S, A>(
  this: State<S, A>,
  f: (a: A) => State<S, unknown>,
): State<S, A> {
  return flatTap_(this, f);
};

Object.defineProperty(State.prototype, 'flatten', {
  get<S, A>(this: State<S, State<S, A>>): State<S, A> {
    return flatten(this);
  },
});

State.prototype.runState = function <S, A>(this: State<S, A>, s: S): [S, A] {
  return runState_(this, s);
};
