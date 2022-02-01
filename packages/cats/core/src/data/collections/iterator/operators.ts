// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Option } from '../../option';
import { empty, lift } from './constructors';
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
) => (it: Iterator<A>) => B = (z, f) => it => fold_(it, z, f);

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

export const filter_ = <A>(
  it: Iterator<A>,
  f: (a: A) => boolean,
): Iterator<A> => {
  let done = false;
  return lift(() => {
    while (!done) {
      const next = it.next();
      done = next.done ?? false;
      if (!next.done && f(next.value)) return next;
    }
    return IR.done;
  });
};

export const collect_ = <A, B>(
  it: Iterator<A>,
  f: (a: A) => Option<B>,
): Iterator<B> => {
  let done = false;
  return lift(() => {
    while (!done) {
      const next = it.next();
      done = next.done ?? false;
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
  let done = false;
  return lift(() => {
    while (!done) {
      const next = it.next();
      done = next.done ?? false;
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

export const fold_ = <A, B>(it: Iterator<A>, z: B, f: (b: B, a: A) => B): B => {
  let result: B = z;
  for (let i = it.next(); !i.done; i = it.next()) {
    result = f(result, i.value);
  }
  return result;
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
    if (!next.done) return IR.pure((cur = f(cur, next.value)));
    return IR.done;
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
  <C>(f: (a: A, b: B) => C): Iterator<C> =>
    lift(() => IR.flatMap_(lhs.next(), l => IR.map_(rhs.next(), r => f(l, r))));

export const zipAllWith_ =
  <A, B>(
    lhs: Iterator<A>,
    rhs: Iterator<B>,
    defaultL: () => A,
    defaultR: () => B,
  ) =>
  <C>(f: (a: A, b: B) => C): Iterator<C> =>
    lift(() => {
      const l = lhs.next();
      const r = rhs.next();
      if (l.done && r.done) return IR.done;
      return IR.flatMap_(
        IR.orElse_(l, () => IR.pure(defaultL())),
        l =>
          IR.map_(
            IR.orElse_(r, () => IR.pure(defaultR())),
            r => f(l, r),
          ),
      );
    });
