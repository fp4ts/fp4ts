// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, fst, snd, throwError, constant } from '@fp4ts/core';
import { Eq, Monoid, Ord, Compare } from '@fp4ts/cats-kernel';
import { MonoidK } from '../../../monoid-k';
import { Option, Some, None } from '../../option';

import { List } from '../list';
import { Vector } from '../vector';
import { Iter } from '../iterator';

import { Bin, Empty, Node, Set } from './algebra';
import { fromArray } from './constructors';

export const isEmpty = <A>(sa: Set<A>): boolean => sa === Empty;
export const nonEmpty = <A>(sa: Set<A>): boolean => sa !== Empty;

export const size = <A>(sa: Set<A>): number => sa.size;

export const head = <A>(sa: Set<A>): A =>
  min(sa).getOrElse(() => throwError(new Error('Set.Empty.head')));
export const headOption = <A>(sa: Set<A>): Option<A> => min(sa);
export const tail = <A>(sa: Set<A>): Set<A> =>
  popMin(sa)
    .map(snd)
    .getOrElse(() => Empty);

export const last = <A>(sa: Set<A>): A =>
  lastOption(sa).getOrElse(() => throwError(new Error('Set.Empty.last')));
export const lastOption = <A>(sa: Set<A>): Option<A> => max(sa);
export const init = <A>(sa: Set<A>): Set<A> =>
  popMax(sa)
    .map(snd)
    .getOrElse(() => Empty);

export const min = <A>(sa: Set<A>): Option<A> => popMin(sa).map(fst);

export const popMin = <A>(sa: Set<A>): Option<[A, Set<A>]> => {
  const sn = sa as Node<A>;
  if (sn.tag === 'empty') return None;
  const { x, s } = _getMinView(sn.value, sn.lhs, sn.rhs);
  return Some([x, s]);
};

export const max = <A>(sa: Set<A>): Option<A> => popMax(sa).map(fst);

export const popMax = <A>(sa: Set<A>): Option<[A, Set<A>]> => {
  const sn = sa as Node<A>;
  if (sn.tag === 'empty') return None;
  const { x, s } = _getMaxView(sn.value, sn.lhs, sn.rhs);
  return Some([x, s]);
};

export function* iterator<A>(sa: Set<A>): Generator<A> {
  const sn = sa as Node<A>;
  if (sn.tag === 'empty') return;

  yield* iterator(sn.lhs);
  yield sn.value;
  yield* iterator(sn.rhs);
}

export function* reverseIterator<A>(sa: Set<A>): Generator<A> {
  const sn = sa as Node<A>;
  if (sn.tag === 'empty') return;

  yield* iterator(sn.rhs);
  yield sn.value;
  yield* iterator(sn.lhs);
}

export const toArray = <A>(sa: Set<A>): A[] => {
  const rs: A[] = new Array(sa.size);
  let idx = 0;
  forEach_(sa, x => (rs[idx++] = x));
  return rs;
};

export const toList = <A>(sa: Set<A>): List<A> =>
  foldRight_(sa, List.empty as List<A>, (x, xs) => xs.prepend(x));

export const toVector = <A>(sa: Set<A>): Vector<A> =>
  foldLeft_(sa, Vector.empty as Vector<A>, (xs, x) => xs.append(x));

// -- Point-ful operators

export const contains_ = <A>(O: Ord<A>, sa: Set<A>, x: A): boolean => {
  const sn = sa as Node<A>;
  if (sn.tag === 'empty') return false;

  const cmp = O.compare(x, sn.value);
  switch (cmp) {
    case Compare.LT:
      return contains_(O, sn.lhs, x);
    case Compare.GT:
      return contains_(O, sn.rhs, x);
    case Compare.EQ:
      return true;
  }
};

export const all_ = <A>(sa: Set<A>, p: (a: A) => boolean): boolean =>
  Iter.all_(iterator(sa), p);
export const any_ = <A>(sa: Set<A>, p: (a: A) => boolean): boolean =>
  Iter.any_(iterator(sa), p);
export const count_ = <A>(sa: Set<A>, p: (a: A) => boolean): number =>
  Iter.count_(iterator(sa), p);

export const elem_ = <A>(sa: Set<A>, idx: number): A =>
  elemOption_(sa, idx).getOrElse(() =>
    throwError(new Error('index out of bounds')),
  );

export const elemOption_ = <A>(sa: Set<A>, idx: number): Option<A> => {
  if (idx < 0 || idx > sa.size) return None;

  const sn = sa as Node<A>;
  if (sn.tag === 'empty') return None;

  if (idx < sn.lhs.size) return elemOption_(sn.lhs, idx);
  if (idx > sn.lhs.size) return elemOption_(sn.rhs, idx - sn.lhs.size);
  return Some(sn.value);
};

export const take_ = <A>(sa: Set<A>, n: number): Set<A> => {
  if (n <= 0) return Empty;
  if (n >= sa.size) return sa;

  const sn = sa as Node<A>;
  if (sn.tag === 'empty') return Empty;

  if (sn.lhs.size > n) return take_(sn.lhs, n);
  if (sn.lhs.size === n) return sn.lhs;
  return _link(sn.value, sn.lhs, take_(sn.rhs, n - sn.lhs.size - 1));
};

export const takeRight_ = <A>(sa: Set<A>, n: number): Set<A> => {
  if (n <= 0) return Empty;
  if (n >= sa.size) return sa;

  const sn = sa as Node<A>;
  if (sn.tag === 'empty') return Empty;

  if (sn.rhs.size > n) return takeRight_(sn.rhs, n);
  if (sn.rhs.size === n) return sn.rhs;
  return _link(sn.value, takeRight_(sn.lhs, n - sn.rhs.size - 1), sn.rhs);
};

export const drop_ = <A>(sa: Set<A>, n: number): Set<A> => {
  if (n <= 0) return sa;
  if (n >= sa.size) return Empty;

  const sn = sa as Node<A>;
  if (sn.tag === 'empty') return Empty;

  if (sn.lhs.size > n) return _link(sn.value, drop_(sn.lhs, n), sn.rhs);
  if (sn.lhs.size === n) return _insertMin(sn.value, sn.rhs);
  return drop_(sn.rhs, n - sn.lhs.size - 1);
};

export const dropRight_ = <A>(sa: Set<A>, n: number): Set<A> => {
  if (n <= 0) return sa;
  if (n >= sa.size) return Empty;

  const sn = sa as Node<A>;
  if (sn.tag === 'empty') return Empty;

  if (sn.rhs.size > n) return _link(sn.value, sn.lhs, dropRight_(sn.rhs, n));
  if (sn.rhs.size === n) return _insertMax(sn.value, sn.lhs);
  return dropRight_(sn.lhs, n - sn.rhs.size - 1);
};

export const slice_ = <A>(sa: Set<A>, from: number, until: number): Set<A> =>
  take_(drop_(sa, from), from - until);

export const insert_ = <A>(O: Ord<A>, sa: Set<A>, x: A): Set<A> => {
  const sn = sa as Node<A>;
  if (sn.tag === 'empty') return new Bin(x, Empty, Empty);

  const cmp = O.compare(x, sn.value);
  switch (cmp) {
    case Compare.LT: {
      const l = insert_(O, sn.lhs, x);
      return l === sn.lhs ? sn : _balanceL(sn.value, l, sn.rhs);
    }
    case Compare.GT: {
      const r = insert_(O, sn.rhs, x);
      return r === sn.rhs ? sn : _balanceR(sn.value, sn.lhs, r);
    }
    case Compare.EQ:
      return sn;
  }
};

export const remove_ = <A>(O: Ord<A>, sa: Set<A>, x: A): Set<A> => {
  const sn = sa as Node<A>;
  if (sn.tag === 'empty') return sn;

  const cmp = O.compare(x, sn.value);
  switch (cmp) {
    case Compare.LT: {
      const l = remove_(O, sn.lhs, x);
      return l === sn.lhs ? sn : _balanceR(sn.value, l, sn.rhs);
    }
    case Compare.GT: {
      const r = remove_(O, sn.rhs, x);
      return r === sn.rhs ? sn : _balanceL(sn.value, sn.lhs, r);
    }
    case Compare.EQ:
      return _glue(sn.lhs, sn.rhs);
  }
};

export const union_ = <A>(O: Ord<A>, l: Set<A>, r: Set<A>): Set<A> => {
  const ln = l as Node<A>;
  if (ln.tag === 'empty') return r;
  const rn = r as Node<A>;
  if (rn.tag === 'empty') return l;

  if (rn.size === 1) return insert_(O, ln, rn.value);
  if (ln.size === 1) return insert_(O, rn, ln.value);

  const [l2, r2] = split_(O, rn, ln.value);
  const l1l2 = union_(O, ln.lhs, l2);
  const r1r2 = union_(O, ln.rhs, r2);

  return l1l2 === ln.lhs && r1r2 === ln.rhs ? ln : _link(ln.value, l1l2, r1r2);
};

export const intersection_ = <A>(O: Ord<A>, l: Set<A>, r: Set<A>): Set<A> => {
  const ln = l as Node<A>;
  if (ln.tag === 'empty') return Empty;
  const rn = r as Node<A>;
  if (rn.tag === 'empty') return Empty;

  const [l2, found, r2] = splitMember_(O, rn, ln.value);
  const l1l2 = intersection_(O, ln.lhs, l2);
  const r1r2 = intersection_(O, ln.rhs, r2);

  return found
    ? l1l2 === ln.lhs && r1r2 === ln.rhs
      ? ln
      : _link(ln.value, l1l2, r1r2)
    : _merge(l1l2, r1r2);
};

export const difference_ = <A>(O: Ord<A>, l: Set<A>, r: Set<A>): Set<A> => {
  const ln = l as Node<A>;
  if (ln.tag === 'empty') return Empty;
  const rn = r as Node<A>;
  if (rn.tag === 'empty') return ln;

  const [l1, r1] = split_(O, ln, rn.value);
  const l1l2 = difference_(O, l1, rn.lhs);
  const r1r2 = difference_(O, r1, rn.rhs);

  return l1l2.size + r1r2.size === ln.size ? ln : _merge(l1l2, r1r2);
};

export const symmetricDifference_ = <A>(
  O: Ord<A>,
  l: Set<A>,
  r: Set<A>,
): Set<A> => union_(O, difference_(O, l, r), difference_(O, r, l));

export const split_ = <A>(O: Ord<A>, sa: Set<A>, x: A): [Set<A>, Set<A>] => {
  const sn = sa as Node<A>;
  if (sn.tag === 'empty') return [Empty, Empty];

  const cmp = O.compare(x, sn.value);
  switch (cmp) {
    case Compare.LT: {
      const [lt, gt] = split_(O, sn.lhs, x);
      return [lt, _link(sn.value, gt, sn.rhs)];
    }
    case Compare.GT: {
      const [lt, gt] = split_(O, sn.rhs, x);
      return [_link(sn.value, sn.lhs, lt), gt];
    }
    case Compare.EQ:
      return [sn.lhs, sn.rhs];
  }
};

export const splitMember_ = <A>(
  O: Ord<A>,
  sa: Set<A>,
  x: A,
): [Set<A>, boolean, Set<A>] => {
  const sn = sa as Node<A>;
  if (sn.tag === 'empty') return [Empty, false, Empty];

  const cmp = O.compare(x, sn.value);
  switch (cmp) {
    case Compare.LT: {
      const [lt, found, gt] = splitMember_(O, sn.lhs, x);
      return [lt, found, _link(sn.value, gt, sn.rhs)];
    }
    case Compare.GT: {
      const [lt, found, gt] = splitMember_(O, sn.rhs, x);
      return [_link(sn.value, sn.lhs, lt), found, gt];
    }
    case Compare.EQ:
      return [sn.lhs, true, sn.rhs];
  }
};

export const filter_ = <A>(sa: Set<A>, p: (a: A) => boolean): Set<A> => {
  const sn = sa as Node<A>;

  if (sn.tag === 'empty') return sn;

  const l = filter_(sn.lhs, p);
  const r = filter_(sn.rhs, p);

  return p(sn.value)
    ? l === sn.lhs && r === sn.rhs
      ? sn
      : _link(sn.value, l, r)
    : _merge(l, r);
};

export const map_ = <A, B>(O: Ord<B>, sa: Set<A>, f: (a: A) => B): Set<B> =>
  fromArray(
    O,
    toArray(sa).map(x => f(x)),
  );

export const forEach_ = <A>(sa: Set<A>, f: (a: A) => void): void => {
  const sn = sa as Node<A>;
  switch (sn.tag) {
    case 'empty':
      return;
    case 'bin':
      forEach_(sn.lhs, f);
      f(sn.value);
      forEach_(sn.rhs, f);
  }
};

export const partition_ = <A>(
  sa: Set<A>,
  p: (a: A) => boolean,
): [Set<A>, Set<A>] => {
  const sn = sa as Node<A>;
  if (sn.tag === 'empty') return [Empty, Empty];

  const [l1, l2] = partition_(sn.lhs, p);
  const [r1, r2] = partition_(sn.rhs, p);

  if (p(sn.value)) {
    return [
      _merge(l1, r1),
      l2 === sn.lhs && r2 === sn.rhs ? sn : _link(sn.value, l2, r2),
    ];
  } else {
    return [
      l1 === sn.lhs && r1 === sn.rhs ? sn : _link(sn.value, l1, r1),
      _merge(l2, r2),
    ];
  }
};

export const foldLeft_ = <A, B>(sa: Set<A>, z: B, f: (b: B, x: A) => B): B => {
  const sn = sa as Node<A>;
  switch (sn.tag) {
    case 'empty':
      return z;
    case 'bin': {
      const lr = foldLeft_(sn.lhs, z, f);
      const xr = f(lr, sn.value);
      return foldLeft_(sn.rhs, xr, f);
    }
  }
};

export const foldLeft1_ = <A>(sa: Set<A>, f: (b: A, x: A) => A): A =>
  popMin(sa).fold(
    () => throwError(new Error('Set.Empty.foldLeft1')),
    ([hd, tl]) => foldLeft_(tl, hd, f),
  );

export const foldRight_ = <A, B>(sa: Set<A>, z: B, f: (x: A, b: B) => B): B => {
  const sn = sa as Node<A>;
  switch (sn.tag) {
    case 'empty':
      return z;
    case 'bin': {
      const rr = foldRight_(sn.rhs, z, f);
      const xr = f(sn.value, rr);
      return foldRight_(sn.lhs, xr, f);
    }
  }
};

export const foldRight1_ = <A>(sa: Set<A>, f: (x: A, b: A) => A): A =>
  popMax(sa).fold(
    () => throwError(new Error('Set.Empty.foldRight1')),
    ([hd, tl]) => foldRight_(tl, hd, f),
  );

export const foldMap_ =
  <M>(M: Monoid<M>) =>
  <A>(sa: Set<A>, f: (a: A) => M): M =>
    foldLeft_(sa, M.empty, (acc, x) => M.combine_(acc, () => f(x)));

export const foldMapK_ =
  <F>(F: MonoidK<F>) =>
  <A, B>(sa: Set<A>, f: (a: A) => Kind<F, [B]>): Kind<F, [B]> =>
    foldLeft_(sa, F.emptyK<A>(), (acc, x) => F.combineK_(acc, () => f(x)));

export const equals_ =
  <A>(E: Eq<A>) =>
  (l: Set<A>, r: Set<A>): boolean => {
    if (l.size !== r.size) return false;
    const xs = toArray(l);
    const ys = toArray(r);
    for (let i = 0, l = xs.length; i < l; i++) {
      if (E.notEquals(xs[i], ys[i])) return false;
    }
    return true;
  };

// -- Assertions

export const isValid = <A>(O: Ord<A>, sa: Set<A>): boolean =>
  isOrdered(O, sa) && isBalanced(sa) && hasValidSize(sa);

export const isOrdered = <A>(O: Ord<A>, sa: Set<A>): boolean => {
  const bounded = (
    sa: Set<A>,
    lo: (a: A) => boolean,
    hi: (a: A) => boolean,
  ): boolean => {
    const sn = sa as Node<A>;
    if (sn.tag === 'empty') return true;

    return (
      lo(sn.value) &&
      hi(sn.value) &&
      bounded(sn.lhs, lo, x => O.lt(x, sn.value)) &&
      bounded(sn.rhs, x => O.gt(x, sn.value), hi)
    );
  };

  return bounded(sa, constant(true), constant(true));
};

export const isBalanced = <A>(sa: Set<A>): boolean => {
  const sn = sa as Node<A>;
  return sn.tag === 'empty'
    ? true
    : (sn.lhs.size + sn.rhs.size <= 1 ||
        (sn.lhs.size <= delta * sn.rhs.size &&
          sn.rhs.size <= delta * sn.rhs.size)) &&
        isBalanced(sn.lhs) &&
        isBalanced(sn.rhs);
};

export const hasValidSize = <A>(sa: Set<A>): boolean => {
  const realSize = (sa: Set<A>): number => {
    const sn = sa as Node<A>;
    return sn.tag === 'empty' ? 0 : realSize(sn.lhs) + 1 + realSize(sn.rhs);
  };
  return sa.size === realSize(sa);
};

// -- Private implementations

const delta = 3;
const ratio = 2;

function _balanceL<A>(x: A, l: Set<A>, r: Set<A>): Set<A> {
  const ln = l as Node<A>;
  if (r.size === 0) {
    if (ln.tag === 'empty') {
      return new Bin(x, Empty, Empty);
    } else if (ln.size === 1) {
      return new Bin(x, l, Empty);
    } else if (ln.lhs.size === 0) {
      return new Bin(
        (ln.rhs as Bin<A>).value,
        new Bin(ln.value, Empty, Empty),
        new Bin(x, Empty, Empty),
      );
    } else if (ln.rhs.size === 0) {
      return new Bin(ln.value, ln.lhs, new Bin(x, Empty, Empty));
    }

    return ln.rhs.size < ratio * ln.lhs.size
      ? new Bin(ln.value, ln.lhs, new Bin(x, ln.rhs, Empty))
      : new Bin(
          (ln.rhs as Bin<A>).value,
          new Bin(ln.value, ln.lhs, (ln.rhs as Bin<A>).lhs),
          new Bin(x, (ln.rhs as Bin<A>).rhs, Empty),
        );
  }

  if (ln.tag === 'empty') {
    return new Bin(x, Empty, r);
  } else if (ln.size <= delta * r.size) {
    return new Bin(x, l, r);
  }

  return ln.rhs.size < ratio * ln.lhs.size
    ? new Bin(ln.value, ln.lhs, new Bin(x, ln.rhs, r))
    : new Bin(
        (ln.rhs as Bin<A>).value,
        new Bin(ln.value, ln.lhs, (ln.rhs as Bin<A>).lhs),
        new Bin(x, (ln.rhs as Bin<A>).rhs, r),
      );
}

function _balanceR<A>(x: A, l: Set<A>, r: Set<A>): Set<A> {
  const rn = r as Node<A>;
  if (l.size === 0) {
    if (rn.tag === 'empty') {
      return new Bin(x, Empty, Empty);
    } else if (rn.size === 1) {
      return new Bin(x, Empty, r);
    } else if (rn.lhs.size === 0) {
      return new Bin(rn.value, new Bin(x, Empty, Empty), rn.rhs);
    } else if (rn.rhs.size === 0) {
      return new Bin(
        (rn.lhs as Bin<A>).value,
        new Bin(x, Empty, Empty),
        new Bin(rn.value, Empty, Empty),
      );
    }

    return rn.lhs.size < ratio * rn.rhs.size
      ? new Bin(rn.value, new Bin(x, Empty, rn.lhs), rn.rhs)
      : new Bin(
          (rn.lhs as Bin<A>).value,
          new Bin(x, Empty, (rn.lhs as Bin<A>).lhs),
          new Bin(rn.value, (rn.lhs as Bin<A>).rhs, rn.rhs),
        );
  }

  if (rn.tag === 'empty') {
    return new Bin(x, l, Empty);
  } else if (rn.size <= delta * l.size) {
    return new Bin(x, l, r);
  }

  return rn.lhs.size < ratio * rn.rhs.size
    ? new Bin(rn.value, new Bin(x, l, rn.lhs), rn.rhs)
    : new Bin(
        (rn.lhs as Bin<A>).value,
        new Bin(x, l, (rn.lhs as Bin<A>).lhs),
        new Bin(rn.value, (rn.lhs as Bin<A>).rhs, rn.rhs),
      );
}

export const _link = <A>(x: A, l: Set<A>, r: Set<A>): Set<A> => {
  const ln = l as Node<A>;
  if (ln.tag === 'empty') return _insertMin(x, r);
  const rn = r as Node<A>;
  if (rn.tag === 'empty') return _insertMax(x, l);

  if (delta * ln.size < rn.size)
    return _balanceL(rn.value, _link(x, ln, rn.lhs), rn.rhs);
  else if (delta * rn.size < ln.size)
    return _balanceR(ln.value, ln.lhs, _link(x, ln.rhs, rn));
  else return new Bin(x, ln, rn);
};

export const _insertMax = <A>(x: A, sa: Set<A>): Set<A> => {
  const sn = sa as Node<A>;
  return sn.tag === 'empty'
    ? new Bin(x, Empty, Empty)
    : _balanceR(sn.value, sn.lhs, _insertMax(x, sn.rhs));
};
const _insertMin = <A>(x: A, sa: Set<A>): Set<A> => {
  const sn = sa as Node<A>;
  return sn.tag === 'empty'
    ? new Bin(x, Empty, Empty)
    : _balanceL(sn.value, _insertMin(x, sn.lhs), sn.rhs);
};

const _merge = <A>(l: Set<A>, r: Set<A>): Set<A> => {
  const ln = l as Node<A>;
  if (ln.tag === 'empty') return r;
  const rn = r as Node<A>;
  if (rn.tag === 'empty') return l;

  if (delta * ln.size < rn.size)
    return _balanceL(rn.value, _merge(ln, rn.lhs), rn.rhs);
  else if (delta * rn.size < ln.size)
    return _balanceR(ln.value, ln.lhs, _merge(ln.rhs, rn));
  else return _glue(l, r);
};

const _glue = <A>(l: Set<A>, r: Set<A>): Set<A> => {
  const ln = l as Node<A>;
  if (ln.tag === 'empty') return r;
  const rn = r as Node<A>;
  if (rn.tag === 'empty') return l;

  if (ln.size > rn.size) {
    const { value: lx, lhs: ll, rhs: lr } = ln;
    const { x, s } = _getMaxView(lx, ll, lr);
    return _balanceR(x, s, r);
  } else {
    const { value: rx, lhs: rl, rhs: rr } = rn;
    const { x, s } = _getMinView(rx, rl, rr);
    return _balanceL(x, l, s);
  }
};

type MinView<A> = { x: A; s: Set<A> };
const _getMinView = <A>(x: A, ls: Set<A>, rs: Set<A>): MinView<A> => {
  const sn = ls as Node<A>;
  if (sn.tag === 'empty') return { x, s: rs };

  const { value, lhs, rhs } = sn;
  const view = _getMinView(value, lhs, rhs);
  return { ...view, s: _balanceR(x, view.s, rs) };
};

type MaxView<A> = { x: A; s: Set<A> };
const _getMaxView = <A>(x: A, ls: Set<A>, rs: Set<A>): MaxView<A> => {
  const sn = rs as Node<A>;
  if (sn.tag === 'empty') return { x, s: ls };

  const { value, lhs, rhs } = sn;
  const view = _getMaxView(value, lhs, rhs);
  return { ...view, s: _balanceL(x, ls, view.s) };
};
