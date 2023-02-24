// Copyright (c) 2021-2023 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Option } from '../option';
import { pure as one, done } from './iterator-result';

export const singleton = <A>(x: A): Iterator<A> => {
  let done_ = false;
  return lift(() => {
    if (done_) return done;
    done_ = true;
    return one(x);
  });
};

export const pure = <A>(x: A): Iterator<A> => singleton(x);

export const empty: Iterator<never> = {
  next: () => ({ value: undefined, done: true }),
};

export const of = <A>(...xs: A[]): Iterator<A> => xs[Symbol.iterator]();

export const lift = <A>(next: () => IteratorResult<A>): Iterator<A> => ({
  next,
});

export const range = (
  from: number,
  to: number = Infinity,
): Iterator<number> => {
  let cur = from;
  return lift<number>(() => (cur >= to ? done : one(cur++)));
};

export const unfoldRight = <A, B>(
  z: B,
  f: (b: B) => Option<[A, B]>,
): Iterator<A> => {
  let d: boolean = false;
  return lift(() => {
    if (d) return done;
    const next = f(z);
    if (next.isEmpty) {
      d = true;
      return done;
    }
    const [x, z_] = next.get;
    z = z_;
    return one(x);
  });
};

export const fromArray = <A>(xs: A[]): Iterator<A> => xs[Symbol.iterator]();
export const fromArrayReversed = <A>(xs: A[]): Iterator<A> => {
  let it = xs.length - 1;
  return lift(() => (it >= 0 ? one(xs[it--]) : done));
};
