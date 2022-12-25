// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eval, tupled } from '@fp4ts/core';
import { Monoid, Ord } from '@fp4ts/cats-kernel';
import { Option } from '../../option';
import { empty, lift } from './constructors';
import { Set as OrdSet } from '../set';
import * as IR from './iterator-result';

export const toArray = <A>(iter: Iterator<A>): A[] => {
  const result: A[] = [];
  for (let i = iter.next(), idx = 0; !i.done; i = iter.next(), idx++) {
    result.push(i.value);
  }
  return result;
};

export const filter: <A>(
  f: (a: A) => boolean,
) => (it: Iterator<A>) => Iterator<A> = f => it => filter_(it, f);

export const collect: <A, B>(
  f: (a: A) => Option<B>,
) => (it: Iterator<A>) => Iterator<B> = f => it => collect_(it, f);

export const collectWhile: <A, B>(
  f: (a: A) => Option<B>,
) => (it: Iterator<A>) => Iterator<B> = f => it => collectWhile_(it, f);

export const map: <A, B>(f: (a: A) => B) => (it: Iterator<A>) => Iterator<B> =
  f => it =>
    map_(it, f);

export const flatMap: <A, B>(
  f: (a: A) => Iterator<B>,
) => (it: Iterator<A>) => Iterator<B> = f => it => flatMap_(it, f);

export const fold: <A, B>(
  z: B,
  f: (b: B, a: A) => B,
) => (it: Iterator<A>) => B = (z, f) => it => foldLeft_(it, z, f);

export const scan: <A, B>(
  z: B,
  f: (b: B, a: A) => B,
) => (it: Iterator<A>) => Iterator<B> = (z, f) => it => scan_(it, z, f);

export const concat: <AA>(
  rhs: Iterator<AA>,
) => <A extends AA>(lhs: Iterator<A>) => Iterator<AA> = rhs => lhs =>
  concat_(lhs, rhs);

export const zipWithIndex = <A>(it: Iterator<A>): Iterator<[A, number]> => {
  let idx = 0;
  return map_(it, x => [x, idx++]);
};

// -- Point-ful operators

export const elem_ = <A>(it: Iterator<A>, idx: number): A | undefined => {
  if (idx < 0) return undefined;
  for (let i = it.next(), j = 0; !i.done; i = it.next(), j++) {
    if (j === idx) return i.value;
  }
  return undefined;
};

export const all_ = <A>(it: Iterator<A>, p: (a: A) => boolean): boolean => {
  for (let i = it.next(); !i.done; i = it.next()) {
    if (!p(i.value)) return false;
  }
  return true;
};

export const any_ = <A>(it: Iterator<A>, p: (a: A) => boolean): boolean => {
  for (let i = it.next(); !i.done; i = it.next()) {
    if (p(i.value)) return true;
  }
  return false;
};

export const count_ = <A>(it: Iterator<A>, p: (a: A) => boolean): number => {
  let acc = 0;
  for (let i = it.next(); !i.done; i = it.next()) {
    if (p(i.value)) acc++;
  }
  return acc;
};

export const take_ = <A>(it: Iterator<A>, n: number): Iterator<A> => {
  if (n <= 0) return empty;
  let done: boolean | undefined = false;
  return lift(() => {
    if (n <= 0 || done) return IR.done;
    n--;
    const next = it.next();
    done = next.done;
    return next;
  });
};

export const drop_ = <A>(it: Iterator<A>, n: number): Iterator<A> => {
  if (n <= 0) return it;
  let done: boolean | undefined = false;
  return lift(() => {
    while (n-- > 0 && !done) {
      done = it.next().done;
    }
    if (done) return IR.done;
    const next = it.next();
    done = next.done;
    return next;
  });
};

export const filter_ = <A>(
  it: Iterator<A>,
  f: (a: A) => boolean,
): Iterator<A> => {
  let done: boolean | undefined;
  return lift(() => {
    while (!done) {
      const next = it.next();
      done = next.done;
      if (!next.done && f(next.value)) return next;
    }
    return IR.done;
  });
};

export const collect_ = <A, B>(
  it: Iterator<A>,
  f: (a: A) => Option<B>,
): Iterator<B> => {
  let done: boolean | undefined;
  return lift(() => {
    while (!done) {
      const next = it.next();
      done = next.done;
      let nextVal: Option<B>;
      if (!next.done && (nextVal = f(next.value)).nonEmpty)
        return IR.pure(nextVal.get);
    }
    return IR.done;
  });
};

export const collectWhile_ = <A, B>(
  it: Iterator<A>,
  f: (a: A) => Option<B>,
): Iterator<B> => {
  let done: boolean | undefined;
  return lift(() => {
    while (!done) {
      const next = it.next();
      done = next.done;
      let nextVal: Option<B>;
      if (!next.done && (nextVal = f(next.value)).nonEmpty)
        return IR.pure(nextVal.get);
      done = true;
    }
    return IR.done;
  });
};

export const map_ = <A, B>(it: Iterator<A>, f: (a: A) => B): Iterator<B> =>
  lift(() => IR.map_(it.next(), f));

export const flatMap_ = <A, B>(
  source: Iterator<A>,
  f: (a: A) => Iterator<B>,
): Iterator<B> => {
  let cur: Iterator<B> = empty;
  return lift(() => {
    while (true) {
      const nextB = cur.next();
      if (!nextB.done) return nextB;
      const nextA = source.next();
      if (!nextA.done) {
        cur = f(nextA.value);
        continue;
      }
      return IR.done;
    }
  });
};

export const foldLeft_ = <A, B>(
  it: Iterator<A>,
  z: B,
  f: (b: B, a: A) => B,
): B => {
  for (let i = it.next(); !i.done; i = it.next()) {
    z = f(z, i.value);
  }
  return z;
};

export const foldRight_ = <A, B>(
  it: Iterator<A>,
  ez: Eval<B>,
  f: (a: A, eb: Eval<B>) => Eval<B>,
): Eval<B> => {
  const go: Eval<B> = Eval.defer(() => {
    const next = it.next();
    return next.done ? ez : f(next.value, go);
  });
  return go;
};

export const foldMap_ = <A, M>(
  M: Monoid<M>,
  it: Iterator<A>,
  f: (a: A) => M,
): M =>
  foldRight_(it, Eval.now(M.empty), (a, eb) => M.combineEval_(f(a), eb)).value;

export const foldMapLeft_ = <A, M>(
  M: Monoid<M>,
  it: Iterator<A>,
  f: (a: A) => M,
): M => foldLeft_(it, M.empty, (b, a) => M.combine_(b, f(a)));

export const forEach_ = <A>(it: Iterator<A>, f: (a: A) => void): void => {
  for (let i = it.next(); !i.done; i = it.next()) {
    f(i.value);
  }
};

export const scan_ = <A, B>(
  it: Iterator<A>,
  z: B,
  f: (b: B, a: A) => B,
): Iterator<B> => {
  let cur: B;
  return lift(() => {
    if (cur === undefined) return IR.pure((cur = z));
    const next = it.next();
    return !next.done ? IR.pure((cur = f(cur, next.value))) : IR.done;
  });
};

export const concat_ = <A>(lhs: Iterator<A>, rhs: Iterator<A>): Iterator<A> =>
  lift(() => IR.orElse_(lhs.next(), () => rhs.next()));

export const zip_ = <A, B>(
  lhs: Iterator<A>,
  rhs: Iterator<B>,
): Iterator<[A, B]> => zipWith_(lhs, rhs)((l, r) => [l, r]);

export const zipWith_ =
  <A, B>(lhs: Iterator<A>, rhs: Iterator<B>) =>
  <C>(f: (a: A, b: B) => C): Iterator<C> => {
    let done: boolean | undefined;
    return lift(() => {
      if (done) return IR.done;
      const lr = lhs.next();
      if (lr.done) {
        done = lr.done;
        return IR.done;
      }
      const rr = rhs.next();
      if (rr.done) {
        done = rr.done;
        return IR.done;
      }
      return IR.pure(f(lr.value, rr.value));
    });
  };

export const zipAll_ = <A, B>(
  lhs: Iterator<A>,
  rhs: Iterator<B>,
  defaultL: () => A,
  defaultR: () => B,
): Iterator<[A, B]> => zipAllWith_(lhs, rhs, defaultL, defaultR)(tupled);

export const zipAllWith_ =
  <A, B>(
    lhs: Iterator<A>,
    rhs: Iterator<B>,
    defaultL: () => A,
    defaultR: () => B,
  ) =>
  <C>(f: (a: A, b: B) => C): Iterator<C> => {
    let done: boolean | undefined;
    return lift(() => {
      if (done) return IR.done;
      const l = lhs.next();
      const r = rhs.next();
      if (l.done && r.done) {
        done = true;
        return IR.done;
      }

      const ll = l.done ? defaultL() : l.value;
      const rr = r.done ? defaultR() : r.value;
      return IR.pure(f(ll, rr));
    });
  };

export const distinctBy_ = <A, B>(
  it: Iterator<A>,
  f: (a: A) => B,
): Iterator<A> => {
  let set: Set<B> = new Set();
  let done: boolean | undefined;
  return lift(() => {
    if (done) return IR.done;
    while (true) {
      const next = it.next();
      if (next.done) {
        // drop set reference to no leak
        set = null as any;
        return IR.done;
      }
      const b = f(next.value);
      if (!set.has(b)) {
        set.add(b);
        return IR.pure(next.value);
      }
    }
  });
};

export const distinctByOrd_ = <A, B>(
  it: Iterator<A>,
  f: (a: A) => B,
  O: Ord<B>,
): Iterator<A> => {
  let set: OrdSet<B> = OrdSet.empty;
  let done: boolean | undefined;
  return lift(() => {
    if (done) return IR.done;
    while (true) {
      const next = it.next();
      if (next.done) {
        // drop set reference to no leak
        set = null as any;
        return IR.done;
      }
      const b = f(next.value);
      if (!set.contains(b, O)) {
        set = set.insert(b, O);
        return IR.pure(next.value);
      }
    }
  });
};
